import { redirect } from "next/navigation";

/** Canonical login lives at `/` so the URL stays clean. */
export default function LoginRedirectPage() {
  redirect("/");
}
