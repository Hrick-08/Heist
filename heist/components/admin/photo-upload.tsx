"use client";

import { useState } from "react";

export function PhotoUpload({
  name = "leaderPhoto",
  label = "Leader photo",
}: {
  name?: string;
  label?: string;
}) {
  const [preview, setPreview] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 480;
        let { width, height } = image;
        if (width > max || height > max) {
          const scale = max / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, width, height);
        setPreview(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/12 bg-white/5">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Leader preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-mono-display text-[10px] text-white/25">
            NO IMG
          </span>
        )}
      </div>
      <div>
        <label className="field-label" htmlFor={`${name}-file`}>
          {label}
        </label>
        <input
          id={`${name}-file`}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="block w-full text-xs text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cyan hover:file:bg-cyan/25"
        />
        <p className="mt-1 text-[10px] text-white/30">
          Resized to 480px and stored with the crew record.
        </p>
      </div>
      <input type="hidden" name={name} value={preview} />
    </div>
  );
}
