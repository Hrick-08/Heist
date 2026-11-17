"use client";

import { useRef } from "react";

import { Avatar } from "./avatar";

/** Resize an uploaded photo to max 480px and return it as a JPEG data URL (same as before). */
function resize(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 480 / Math.max(img.width, img.height));
        const w = Math.round(img.width * k);
        const h = Math.round(img.height * k);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve("");
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export function PhotoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <div className="full photo">
      <span className="ph">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Leader preview" className="av" style={{ width: 72, height: 72 }} />
        ) : (
          <Avatar teamId="NEW" size={72} label="No photo yet" />
        )}
      </span>
      <label className="field grow">
        <span>Leader photo</span>
        <input
          ref={file}
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            onChange(f ? await resize(f) : "");
          }}
        />
        <small className="mute">Resized to 480px and stored with the crew record.</small>
      </label>
    </div>
  );
}
