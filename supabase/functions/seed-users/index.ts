import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://deno.land/x/cors_headers@v0.1.1/mod.ts";

const _corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: _corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  // Helper: create user + profile + role
  async function createUser(
    email: string,
    password: string,
    fullName: string,
    role: string,
    trackId?: string
  ) {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);
    
    let userId: string;
    if (existing) {
      userId = existing.id;
      results.push(`User ${email} already exists (${userId})`);
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) {
        results.push(`ERROR creating ${email}: ${error.message}`);
        return null;
      }
      userId = data.user.id;
      results.push(`Created ${email} (${userId})`);
    }

    // Ensure profile exists
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    
    if (!profile) {
      await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
      });
    }

    // Ensure role exists
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .single();

    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role,
      });
      results.push(`  → role: ${role}`);
    }

    // If data_entry, assign to track
    if (role === "data_entry" && trackId) {
      const { data: existingAssignment } = await supabaseAdmin
        .from("data_entry_assignments")
        .select("id")
        .eq("user_id", userId)
        .eq("track_id", trackId)
        .single();

      if (!existingAssignment) {
        await supabaseAdmin.from("data_entry_assignments").insert({
          user_id: userId,
          track_id: trackId,
        });
        results.push(`  → assigned to track ${trackId}`);
      }
    }

    return userId;
  }

  try {
    // Create leader
    await createUser("leader@sana.test", "Test1234", "نورة القحطاني", "leader");

    // Create data entry - assigned to بهور track
    await createUser(
      "dataentry@sana.test",
      "Test1234",
      "رحاب العمري",
      "data_entry",
      "a1000000-0000-0000-0000-000000000001" // بهور
    );

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ..._corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), results }), {
      status: 500,
      headers: { ..._corsHeaders, "Content-Type": "application/json" },
    });
  }
});
