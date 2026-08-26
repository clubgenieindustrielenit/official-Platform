import { redirect } from "next/navigation";

export default function ClassementPage() {
  // Cette section est désormais réservée exclusivement à l'administration
  redirect("/membre");
}