import { redirect } from "react-router";
import RegisterForm from "./RegisterForm";
import { api } from "../utils/serviceAPI";
import type { ActionFunctionArgs } from "react-router";

export async function clientLoader() {
  if (api.isAuthenticated()) {
    throw redirect("/home");
  }
  return {};
}

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  try {
    await api.register({ email, password, firstName, lastName });
    return redirect("/");
  } catch (error: any) {
    return { error: error?.message || "Błąd rejestracji. Spróbuj ponownie." };
  }
}

export default RegisterForm;
