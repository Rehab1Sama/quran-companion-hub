import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  async function createUser(
    email: string,
    password: string,
    fullName: string,
    role: string,
    options?: { trackId?: string; halaqahId?: string; halaqahRole?: string }
  ) {
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      results.push(`Exists: ${email}`);
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) {
        results.push(`ERROR ${email}: ${error.message}`);
        return null;
      }
      userId = data.user.id;
      results.push(`Created: ${email}`);
    }

    // Profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (!profile) {
      await supabaseAdmin.from("profiles").insert({ user_id: userId, full_name: fullName });
    }

    // Role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .single();
    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    }

    // Data entry assignment
    if (role === "data_entry" && options?.trackId) {
      const { data: ea } = await supabaseAdmin
        .from("data_entry_assignments")
        .select("id")
        .eq("user_id", userId)
        .eq("track_id", options.trackId)
        .single();
      if (!ea) {
        await supabaseAdmin.from("data_entry_assignments").insert({
          user_id: userId,
          track_id: options.trackId,
        });
      }
    }

    // Halaqah membership
    if (options?.halaqahId) {
      const memberRole = options.halaqahRole || role;
      const { data: em } = await supabaseAdmin
        .from("halaqah_members")
        .select("id")
        .eq("user_id", userId)
        .eq("halaqah_id", options.halaqahId)
        .single();
      if (!em) {
        await supabaseAdmin.from("halaqah_members").insert({
          user_id: userId,
          halaqah_id: options.halaqahId,
          role: memberRole,
        });
      }
    }

    return userId;
  }

  try {
    // Halaqah IDs (from database)
    const halaqat = {
      buhur1: "92c33931-3b91-4c58-805f-248cb372e5a5",
      buhur2: "84bbf55d-c2dd-4b1f-aefb-0eb71f6b8e97",
      ishraq1: "8c6e2a44-8086-4d02-816d-912b4012a0af",
      ishraq2: "a7dc188c-e2e6-4849-91ed-1020a6d38ec0",
      buhur3: "c238267a-fb96-4587-b468-cbfd9b2385a9",
    };

    const trackIds = {
      buhur: "a1000000-0000-0000-0000-000000000001",
      ishraq: "a1000000-0000-0000-0000-000000000002",
      qabas: "a1000000-0000-0000-0000-000000000003",
    };

    // === Leader ===
    await createUser("leader@sana.test", "Test1234", "نورة القحطاني", "leader");

    // === Data Entry (3) ===
    await createUser("dataentry@sana.test", "Test1234", "رحاب العمري", "data_entry", { trackId: trackIds.buhur });
    await createUser("dataentry2@sana.test", "Test1234", "سارة الحربي", "data_entry", { trackId: trackIds.ishraq });
    await createUser("dataentry3@sana.test", "Test1234", "هدى المالكي", "data_entry", { trackId: trackIds.qabas });

    // === Teachers (5) ===
    const teacherIds: string[] = [];
    const teachers = [
      { email: "teacher1@sana.test", name: "فاطمة الزهراني", halaqah: halaqat.buhur1 },
      { email: "teacher2@sana.test", name: "عائشة السلمي", halaqah: halaqat.buhur2 },
      { email: "teacher3@sana.test", name: "مريم الغامدي", halaqah: halaqat.ishraq1 },
      { email: "teacher4@sana.test", name: "خديجة العتيبي", halaqah: halaqat.ishraq2 },
      { email: "teacher5@sana.test", name: "أسماء الشهري", halaqah: halaqat.buhur3 },
    ];
    for (const t of teachers) {
      const id = await createUser(t.email, "Test1234", t.name, "teacher", {
        halaqahId: t.halaqah,
        halaqahRole: "teacher",
      });
      if (id) teacherIds.push(id);
    }

    // === Students (20) — 4 per halaqah ===
    const studentNames = [
      "لمى أحمد", "نوف خالد", "ريم سعد", "دانة محمد",
      "هيا عبدالله", "لينا فهد", "سلمى ناصر", "جنى عمر",
      "تالا يوسف", "رزان إبراهيم", "ديما صالح", "حلا علي",
      "رغد حسن", "شهد عادل", "وعد طارق", "ملاك بندر",
      "أريج سلطان", "بيان ماجد", "لجين راشد", "غادة فيصل",
    ];

    const halaqahList = [
      halaqat.buhur1, halaqat.buhur1, halaqat.buhur1, halaqat.buhur1,
      halaqat.buhur2, halaqat.buhur2, halaqat.buhur2, halaqat.buhur2,
      halaqat.ishraq1, halaqat.ishraq1, halaqat.ishraq1, halaqat.ishraq1,
      halaqat.ishraq2, halaqat.ishraq2, halaqat.ishraq2, halaqat.ishraq2,
      halaqat.buhur3, halaqat.buhur3, halaqat.buhur3, halaqat.buhur3,
    ];

    const studentIds: { id: string; halaqahId: string }[] = [];
    for (let i = 0; i < 20; i++) {
      const email = `student${i + 1}@sana.test`;
      const id = await createUser(email, "Test1234", studentNames[i], "student", {
        halaqahId: halaqahList[i],
        halaqahRole: "student",
      });
      if (id) studentIds.push({ id, halaqahId: halaqahList[i] });
    }

    // === Daily Records for 1 week ===
    const today = new Date();
    const surahs = [1, 2, 3, 36, 67, 78, 93, 112]; // sample surahs

    for (const student of studentIds) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString().split("T")[0];

        // Skip weekends (Friday=5, Saturday=6)
        const dow = date.getDay();
        if (dow === 5 || dow === 6) continue;

        // Random absence ~15%
        const isAbsent = Math.random() < 0.15;

        const record: Record<string, unknown> = {
          student_id: student.id,
          halaqah_id: student.halaqahId,
          record_date: dateStr,
          is_absent: isAbsent,
        };

        if (!isAbsent) {
          const surahIdx = Math.floor(Math.random() * surahs.length);
          const fromAyah = Math.floor(Math.random() * 20) + 1;
          const toAyah = fromAyah + Math.floor(Math.random() * 15) + 5;

          record.hifz_from_surah = surahs[surahIdx];
          record.hifz_from_ayah = fromAyah;
          record.hifz_to_surah = surahs[surahIdx];
          record.hifz_to_ayah = toAyah;
          record.hifz_pages = +(Math.random() * 2 + 0.5).toFixed(2);

          record.near_review_from_surah = surahs[(surahIdx + 1) % surahs.length];
          record.near_review_from_ayah = 1;
          record.near_review_to_surah = surahs[(surahIdx + 1) % surahs.length];
          record.near_review_to_ayah = Math.floor(Math.random() * 30) + 10;
          record.near_review_pages = +(Math.random() * 3 + 1).toFixed(2);

          record.far_review_from_surah = surahs[(surahIdx + 2) % surahs.length];
          record.far_review_from_ayah = 1;
          record.far_review_to_surah = surahs[(surahIdx + 2) % surahs.length];
          record.far_review_to_ayah = Math.floor(Math.random() * 40) + 15;
          record.far_review_pages = +(Math.random() * 4 + 1).toFixed(2);

          record.tilawa_from_surah = surahs[(surahIdx + 3) % surahs.length];
          record.tilawa_from_ayah = 1;
          record.tilawa_to_surah = surahs[(surahIdx + 3) % surahs.length];
          record.tilawa_to_ayah = Math.floor(Math.random() * 50) + 20;
          record.tilawa_pages = +(Math.random() * 5 + 2).toFixed(2);
        }

        // Check if record already exists for this student+date
        const { data: existing } = await supabaseAdmin
          .from("daily_records")
          .select("id")
          .eq("student_id", student.id)
          .eq("record_date", dateStr)
          .single();

        if (!existing) {
          await supabaseAdmin.from("daily_records").insert(record);
        }
      }
    }

    results.push(`Created ${studentIds.length} students with daily records for 7 days`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), results }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
