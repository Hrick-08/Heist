/* Sweeps every form on the admin pages and checks that posting them never
   creates a Dexter mission by accident. */
import { SignJWT } from "jose";
import { MongoClient } from "mongodb";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
    "70b70b35801f222b3cb29c7b6587784f968a77a255a518155c9427b5276211bd",
);

async function token(role, sub, name) {
  return new SignJWT({ role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
}

function parseForms(html) {
  const forms = [];
  const re = /<form\b([^>]*)>([\s\S]*?)<\/form>/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    const inner = match[2];
    const fields = {};
    const fieldRe = /<input\b([^>]*)\/?>/g;
    let field;
    while ((field = fieldRe.exec(inner)) !== null) {
      const attrs = field[1];
      if ((attrs.match(/type="([^"]*)"/) || [, ""])[1] !== "hidden") continue;
      const name = (attrs.match(/name="([^"]*)"/) || [, ""])[1];
      const value = (attrs.match(/value="([^"]*)"/) || [, ""])[1];
      if (!name) continue;
      fields[name] = value
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&");
    }
    const button = (inner.match(/<button[^>]*>([\s\S]*?)<\/button>/) || [, ""])[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .trim();
    forms.push({ fields, button });
  }
  return forms;
}

function multipart(fields) {
  const boundary = "----sweep" + Math.random().toString(36).slice(2);
  const parts = Object.entries(fields).map(
    ([name, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
  );
  parts.push(`--${boundary}--\r\n`);
  return { body: parts.join(""), boundary };
}

async function main() {
  const cookie = `tlh_session=${await token("admin", "admin", "Event Control")}`;
  const client = new MongoClient(
    process.env.DATABASE,
  );
  await client.connect();
  const db = client.db(process.env.DATABASE_NAME || "last-heist");
  const missions = db.collection("dexterMissions");
  const before = await missions.countDocuments({});

  const pages = [
    "/admin",
    "/admin/teams",
    "/admin/tasks",
    "/admin/dexter",
    "/admin/rounds",
    "/admin/settings",
  ];

  for (const page of pages) {
    const res = await fetch(BASE + page, { headers: { cookie } });
    const html = (await res.text()).replace(/<!-- -->/g, "");
    const forms = parseForms(html);
    console.log(`\n${page}: ${forms.length} form(s)`);
    for (const form of forms) {
      const { body, boundary } = multipart(form.fields);
      const post = await fetch(BASE + page, {
        method: "POST",
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
          origin: BASE,
          cookie,
        },
        body,
        redirect: "manual",
      });
      console.log(`   post "${form.button}" -> ${post.status}`);
    }
  }

  const after = await missions.countDocuments({});
  console.log(`\nmissions before ${before}, after ${after}`);
  if (after !== before) {
    const extra = await missions
      .find({ _id: { $nin: [] } })
      .sort({ createdAt: -1 })
      .limit(after - before)
      .toArray();
    for (const m of extra) {
      console.log(`  NEW MISSION: "${m.title}" scope=${m.scope} created=${m.createdAt}`);
      await missions.deleteOne({ _id: m._id });
    }
  }
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
