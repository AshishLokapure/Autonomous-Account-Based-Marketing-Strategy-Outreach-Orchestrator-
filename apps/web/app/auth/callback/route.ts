import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Ensure profile exists
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          updated_at: new Date().toISOString(),
        });

        // Check workspace membership
        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        const redirectUrl = member ? `${origin}${next}` : `${origin}/onboarding`;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=OAuth+authentication+failed`);
}
