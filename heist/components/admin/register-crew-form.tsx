"use client";

import { ActionForm } from "@/components/admin/action-form";
import { PhotoUpload } from "@/components/admin/photo-upload";
import { registerTeamAction } from "@/lib/actions/admin-actions";

const MEMBER_SLOTS = 4;

export function RegisterCrewForm() {
  return (
    <ActionForm
      action={registerTeamAction}
      submitLabel="Register crew"
      submitClassName="btn-pink"
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Crew name
          </label>
          <input
            id="name"
            name="name"
            className="field"
            placeholder="The Ninth Street Crew"
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Leader login email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="field"
            placeholder="leader@team.com"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="leaderName">
            Leader name
          </label>
          <input id="leaderName" name="leaderName" className="field" required />
        </div>
        <div>
          <label className="field-label" htmlFor="leaderPhone">
            Leader phone
          </label>
          <input id="leaderPhone" name="leaderPhone" className="field" />
        </div>
      </div>

      <PhotoUpload />

      <div>
        <label className="field-label" htmlFor="leaderEmail">
            Leader email (optional, defaults to login email)
        </label>
        <input id="leaderEmail" name="leaderEmail" type="email" className="field" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="password">
            Passcode (blank = auto-generate)
          </label>
          <input
            id="password"
            name="password"
            className="field font-mono-display"
            placeholder="auto"
          />
        </div>
      </div>

      <div>
        <p className="field-label">Crew members (leader + up to 4)</p>
        <div className="space-y-3">
          {Array.from({ length: MEMBER_SLOTS }).map((_, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-3">
              <input
                name="memberName"
                className="field"
                placeholder={`Member ${index + 1} name`}
              />
              <input
                name="memberEmail"
                className="field"
                placeholder="email"
                type="email"
              />
              <input name="memberPhone" className="field" placeholder="phone" />
            </div>
          ))}
        </div>
      </div>
    </ActionForm>
  );
}
