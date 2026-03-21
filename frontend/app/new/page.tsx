import { redirect } from "next/navigation";

export default function NewTripRedirectPage() {
	redirect("/dashboard/plan");
}
