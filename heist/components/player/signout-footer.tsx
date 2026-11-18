import { logoutAction } from "@/lib/actions/auth-actions";
import { Exit } from "./icons";

/** Sign out lives at the very bottom of every screen, where a thumb can find it. */
export function SignOutFooter() {
  return (
    <form action={logoutAction} className="so-foot">
      <button type="submit" className="pbtn ghost signout">
        <Exit size={18} />
        Sign out
      </button>
    </form>
  );
}
