/* VICE CITY · crew registration form ------------------------------------ */
(function () {
  "use strict";

  var form = document.getElementById("registerForm");
  if (!form) return;

  var msg = document.getElementById("regMsg");
  var submitBtn = document.getElementById("submitBtn");
  var success = document.getElementById("regSuccess");
  var fileInput = document.getElementById("leaderPhoto");
  var photoName = document.getElementById("photoName");
  var photoPreview = document.getElementById("photoPreview");
  var asideCrewName = document.getElementById("asideCrewName");

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var photoDataUrl = "";

  function setMsg(text, kind) {
    msg.textContent = text;
    msg.className = "if-msg" + (kind ? " is-" + kind : "");
  }

  /* Resize an uploaded photo to max 480px and return a JPEG data URL —
     the same rule the admin photo field uses, so it is stored identically. */
  function resizePhoto(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, 480 / Math.max(img.width, img.height));
          var w = Math.max(1, Math.round(img.width * k));
          var h = Math.max(1, Math.round(img.height * k));
          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = function () { resolve(""); };
        img.src = String(reader.result);
      };
      reader.onerror = function () { resolve(""); };
      reader.readAsDataURL(file);
    });
  }

  fileInput.addEventListener("change", async function () {
    var file = fileInput.files && fileInput.files[0];
    photoDataUrl = "";
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    if (!file) {
      photoName.textContent = "No file chosen · required";
      return;
    }
    photoName.textContent = "Resizing…";
    photoDataUrl = await resizePhoto(file);
    if (!photoDataUrl) {
      photoName.textContent = "Could not read that image";
      setMsg("That photo could not be read. Try a JPG, PNG or WebP.", "bad");
      return;
    }
    photoPreview.src = photoDataUrl;
    photoPreview.hidden = false;
    photoName.textContent = file.name + " · 480px";
  });

  /* Live crew name in the side file card. */
  document.getElementById("crewName").addEventListener("input", function (e) {
    asideCrewName.textContent = e.target.value.trim().toUpperCase() || "YOUR CREW NAME";
  });

  function value(id) { return document.getElementById(id).value.trim(); }

  function readMember(n) {
    return {
      name: value("m" + n + "name"),
      email: value("m" + n + "email"),
      phone: value("m" + n + "phone"),
    };
  }

  function validate() {
    if (!photoDataUrl) return "Choose a leader photo — it is required.";
    if (value("crewName").length < 2) return "Enter a crew name.";
    if (!EMAIL.test(value("leaderEmail"))) return "Enter a valid leader login email.";
    if (!value("leaderName")) return "Enter the leader's name.";
    if (!value("leaderPhone")) return "Enter the leader's phone number.";

    var members = [readMember(1), readMember(2), readMember(3)];
    var fourth = readMember(4);
    var hasFourth = fourth.name || fourth.email || fourth.phone;
    if (hasFourth) members.push(fourth); // Member 4 is optional.

    for (var i = 0; i < members.length; i += 1) {
      var m = members[i];
      if (!m.name || !EMAIL.test(m.email) || !m.phone) {
        return "Member " + (i + 1) + " needs a name, a valid email and a phone number.";
      }
    }
    return null;
  }

  /* The landing page and the Heist app may be served from different origins.
     Try the same-origin API first, then the documented override, then the
     local dev server. Only JSON responses are accepted as a real answer. */
  function configuredBase() {
    return ((document.querySelector('meta[name="heist-api-base"]') || {}).content || "")
      .trim().replace(/\/$/, "");
  }

  function endpoints() {
    var configured = configuredBase();
    var list = [];
    if (configured) list.push(configured + "/api/register");
    list.push("/api/register");
    list.push("http://localhost:3000/api/register");
    return list.filter(function (url, i, arr) { return arr.indexOf(url) === i; });
  }

  function endpointLabel(url) {
    return url.replace(/\/api\/register$/, "") || "same origin";
  }

  async function postRegistration(payload) {
    var urls = endpoints();
    var attempts = [];
    for (var i = 0; i < urls.length; i += 1) {
      try {
        var res = await fetch(urls[i], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        var type = res.headers.get("content-type") || "no content type";
        if (type.indexOf("application/json") === -1) {
          attempts.push(endpointLabel(urls[i]) + " → HTTP " + res.status + " (" + type + ")");
          continue;
        }
        return {
          ok: res.ok,
          data: await res.json(),
          origin: new URL(urls[i], window.location.href).origin,
        };
      } catch (err) {
        var why = err && err.name === "TypeError"
          ? "blocked / network error (check CORS or the page's CSP)"
          : (err && err.message) || "error";
        attempts.push(endpointLabel(urls[i]) + " → " + why);
      }
    }
    var failure = new Error("Could not reach the registration service.");
    failure.attempts = attempts;
    throw failure;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    var problem = validate();
    if (problem) {
      setMsg(problem, "bad");
      return;
    }

    var payload = {
      name: value("crewName"),
      email: value("leaderEmail"),
      leaderName: value("leaderName"),
      leaderPhone: value("leaderPhone"),
      leaderPhoto: photoDataUrl,
      members: [readMember(1), readMember(2), readMember(3)],
    };
    var fourth = readMember(4);
    if (fourth.name || fourth.email || fourth.phone) payload.members.push(fourth);

    submitBtn.disabled = true;
    submitBtn.textContent = "Registering…";
    setMsg("Sending the crew file to control…");

    try {
      var result = await postRegistration(payload);
      if (!result.ok || !result.data.ok) {
        setMsg(result.data && result.data.error ? result.data.error : "Registration failed. Please try again.", "bad");
        return;
      }
      showSuccess(result.data, result.origin);
    } catch (err) {
      var detail = err.attempts ? " Tried: " + err.attempts.join(" · ") : "";
      setMsg(
        "Could not reach the Heist app." + detail +
          " Check the URL in heist-api-base and the browser console (F12 → Console / Network).",
        "bad",
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register crew";
    }
  });

  function showSuccess(data, origin) {
    document.getElementById("successTitle").textContent = data.waitlisted
      ? "CREW WAITLISTED"
      : "YOU'RE IN THE CITY";
    document.getElementById("successMsg").textContent = data.message || "";
    document.getElementById("successTeamId").textContent = data.teamId;
    document.getElementById("successPasscode").textContent = data.passcode;
    document.getElementById("successLogin").href = origin.replace(/\/$/, "") + "/login";
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("registerAnother").addEventListener("click", function () {
    form.reset();
    photoDataUrl = "";
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    photoName.textContent = "No file chosen · required";
    asideCrewName.textContent = "YOUR CREW NAME";
    setMsg("One registration = one crew = one crew ID. Nothing is charged — entry is free.");
    success.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
