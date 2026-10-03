import { LoginLink } from "@/components/LoginLink";
import { SettingsMenu } from "@/components/SettingsMenu";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/auth0";

// The header gear: shows who is signed in, links our team to /admin, and lets them log out.
// Visitors who aren't signed in get a "Log in" link instead; browsing doesn't need an account.
export async function AccountMenu() {
  const user = await getCurrentUser();
  if (!user) return isAuthConfigured() ? <LoginLink /> : null;
  return (
    <SettingsMenu name={user.name} email={user.email} canLogOut={isAuthConfigured()} isAdmin={isAdmin(user)} />
  );
}
