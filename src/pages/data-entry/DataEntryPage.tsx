import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SURAHS, calculateFaces, calculatePages, formatFaces } from "@/lib/quran-data";
import { Save, UserX } from "lucide-react";

interface StudentEntry {
  userId: string;
  name: string;
  isAbsent: boolean;
  hifzFromSurah: string; hifzFromAyah: string; hifzToSurah: string; hifzToAyah: string;
  nearFromSurah: string; nearFromAyah: string; nearToSurah: string; nearToAyah: string;
  farFromSurah: string; farFromAyah: string; farToSurah: string; farToAyah: string;
  tilawaFromSurah: string; tilawaFromAyah: string; tilawaToSurah: string; tilawaToAyah: string;
}

type Layout = "girls" | "mixed" | "tilawa";

// Determine UI layout from track name (Arabic)
function getLayoutFromTrackName(name: string): Layout {
  const n = (name || "").trim();
  if (n.includes("مشكاة")) return "tilawa";
  if (n.includes("ألق") || n.includes("الق") || n.includes("سراج") || n.includes("مهج")) return "mixed";
  // بهور، إشراق، قبس، ضياء، وهج → girls (3 sections)
  return "girls";
}

function SurahAyahPicker({ label, surah, ayah, onSurahChange, onAyahChange }: {
  label: string; surah: string; ayah: string;
  onSurahChange: (v: string) => void; onAyahChange: (v: string) => void;
}) {
  const selectedSurah = SURAHS.find((s) => String(s.number) === surah);
  return (
    <div className="flex gap-1 items-center">
      <span className="text-xs text-muted-foreground w-8 shrink-0">{label}</span>
      <Select value={surah} onValueChange={onSurahChange}>
        <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="السورة" /></SelectTrigger>
        <SelectContent>
          {SURAHS.map((s) => <SelectItem key={s.number} value={String(s.number)}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={ayah} onValueChange={onAyahChange}>
        <SelectTrigger className="h-8 text-xs w-16"><SelectValue placeholder="آية" /></SelectTrigger>
        <SelectContent>
          {selectedSurah && Array.from({ length: selectedSurah.ayahCount }, (_, i) => i + 1).map((a) => (
            <SelectItem key={a} value={String(a)}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FacesBadge({ from, fa, to, ta }: { from: string; fa: string; to: string; ta: string }) {
  if (!from || !fa || !to || !ta) return null;
  const faces = calculateFaces(Number(from), Number(fa), Number(to), Number(ta));
  if (faces <= 0) return null;
  return <Badge variant="outline" className="text-xs">الأوجه: {formatFaces(faces)}</Badge>;
}

export default function DataEntryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [assignedTrackIds, setAssignedTrackIds] = useState<string[]>([]);
  const [selectedHalaqah, setSelectedHalaqah] = useState("");
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [tracksRes, halaqatRes, assignRes] = await Promise.all([
        supabase.from("tracks").select("*"),
        supabase.from("halaqat").select("*"),
        supabase.from("data_entry_assignments").select("track_id").eq("user_id", user.id),
      ]);
      setTracks(tracksRes.data || []);
      setHalaqat(halaqatRes.data || []);
      setAssignedTrackIds((assignRes.data || []).map((a) => a.track_id));
    };
    load();
  }, [user]);

  const layout: Layout = useMemo(() => {
    const halaqah = halaqat.find((h) => h.id === selectedHalaqah);
    const track = tracks.find((t) => t.id === halaqah?.track_id);
    return getLayoutFromTrackName(track?.name || "");
  }, [selectedHalaqah, halaqat, tracks]);

  useEffect(() => {
    if (!selectedHalaqah) return;
    const loadStudents = async () => {
      const { data: members } = await supabase
        .from("halaqah_members")
        .select("user_id, profiles!halaqah_members_user_id_fkey(full_name)")
        .eq("halaqah_id", selectedHalaqah)
        .eq("role", "student")
        .eq("is_archived", false);

      setStudents((members || []).map((m) => ({
        userId: m.user_id,
        name: (m as any).profiles?.full_name || "—",
        isAbsent: false,
        hifzFromSurah: "", hifzFromAyah: "", hifzToSurah: "", hifzToAyah: "",
        nearFromSurah: "", nearFromAyah: "", nearToSurah: "", nearToAyah: "",
        farFromSurah: "", farFromAyah: "", farToSurah: "", farToAyah: "",
        tilawaFromSurah: "", tilawaFromAyah: "", tilawaToSurah: "", tilawaToAyah: "",
      })));
    };
    loadStudents();
  }, [selectedHalaqah]);

  const updateStudent = (idx: number, field: string, value: any) => {
    setStudents((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const filteredHalaqat = halaqat.filter((h) =>
    assignedTrackIds.includes(h.track_id) && h.name !== "التسجيل"
  );
  const displayHalaqat = assignedTrackIds.length > 0 ? filteredHalaqat : halaqat.filter((h) => h.name !== "التسجيل");

  const calcPagesSafe = (a: string, b: string, c: string, d: string) =>
    a && b && c && d ? calculatePages(Number(a), Number(b), Number(c), Number(d)) : 0;

  const handleSave = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    for (const s of students) {
      const showHifz = layout !== "tilawa";
      const showNear = layout === "girls" || layout === "mixed";
      const showFar = layout === "girls";
      const showTilawa = layout === "tilawa";

      await supabase.from("daily_records").upsert({
        student_id: s.userId,
        halaqah_id: selectedHalaqah,
        record_date: today,
        is_absent: s.isAbsent,
        hifz_from_surah: showHifz && s.hifzFromSurah ? Number(s.hifzFromSurah) : null,
        hifz_from_ayah: showHifz && s.hifzFromAyah ? Number(s.hifzFromAyah) : null,
        hifz_to_surah: showHifz && s.hifzToSurah ? Number(s.hifzToSurah) : null,
        hifz_to_ayah: showHifz && s.hifzToAyah ? Number(s.hifzToAyah) : null,
        hifz_pages: showHifz ? calcPagesSafe(s.hifzFromSurah, s.hifzFromAyah, s.hifzToSurah, s.hifzToAyah) : 0,
        near_review_from_surah: showNear && s.nearFromSurah ? Number(s.nearFromSurah) : null,
        near_review_from_ayah: showNear && s.nearFromAyah ? Number(s.nearFromAyah) : null,
        near_review_to_surah: showNear && s.nearToSurah ? Number(s.nearToSurah) : null,
        near_review_to_ayah: showNear && s.nearToAyah ? Number(s.nearToAyah) : null,
        near_review_pages: showNear ? calcPagesSafe(s.nearFromSurah, s.nearFromAyah, s.nearToSurah, s.nearToAyah) : 0,
        far_review_from_surah: showFar && s.farFromSurah ? Number(s.farFromSurah) : null,
        far_review_from_ayah: showFar && s.farFromAyah ? Number(s.farFromAyah) : null,
        far_review_to_surah: showFar && s.farToSurah ? Number(s.farToSurah) : null,
        far_review_to_ayah: showFar && s.farToAyah ? Number(s.farToAyah) : null,
        far_review_pages: showFar ? calcPagesSafe(s.farFromSurah, s.farFromAyah, s.farToSurah, s.farToAyah) : 0,
        tilawa_from_surah: showTilawa && s.tilawaFromSurah ? Number(s.tilawaFromSurah) : null,
        tilawa_from_ayah: showTilawa && s.tilawaFromAyah ? Number(s.tilawaFromAyah) : null,
        tilawa_to_surah: showTilawa && s.tilawaToSurah ? Number(s.tilawaToSurah) : null,
        tilawa_to_ayah: showTilawa && s.tilawaToAyah ? Number(s.tilawaToAyah) : null,
        tilawa_pages: showTilawa ? calcPagesSafe(s.tilawaFromSurah, s.tilawaFromAyah, s.tilawaToSurah, s.tilawaToAyah) : 0,
        entered_by: user?.id,
      }, { onConflict: "student_id,record_date" });
    }
    toast({ title: "تم الحفظ", description: `تم حفظ بيانات ${students.length} طالبة` });
    setSaving(false);
  };

  const showHifz = layout !== "tilawa";
  const showNear = layout === "girls" || layout === "mixed";
  const showFar = layout === "girls";
  const showTilawa = layout === "tilawa";
  const nearLabel = layout === "girls" ? "مراجعة قريبة" : "مراجعة";

  return (
    <AppLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">إدخال البيانات</h2>
        <Select value={selectedHalaqah} onValueChange={setSelectedHalaqah}>
          <SelectTrigger className="w-64"><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
          <SelectContent>
            {displayHalaqat.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {students.length > 0 && (
          <div className="space-y-3">
            {students.map((s, idx) => (
              <Card key={s.userId} className={`${s.isAbsent ? "opacity-50 border-destructive/30" : ""}`}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{s.name}</CardTitle>
                    <Button
                      variant={s.isAbsent ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => updateStudent(idx, "isAbsent", !s.isAbsent)}
                    >
                      <UserX className="h-3 w-3 ml-1" />
                      {s.isAbsent ? "غائبة" : "حاضرة"}
                    </Button>
                  </div>
                </CardHeader>
                {!s.isAbsent && (
                  <CardContent className="py-2 px-4 space-y-2">
                    {showHifz && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">حفظ</Badge>
                          <FacesBadge from={s.hifzFromSurah} fa={s.hifzFromAyah} to={s.hifzToSurah} ta={s.hifzToAyah} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <SurahAyahPicker label="من" surah={s.hifzFromSurah} ayah={s.hifzFromAyah}
                            onSurahChange={(v) => updateStudent(idx, "hifzFromSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "hifzFromAyah", v)} />
                          <SurahAyahPicker label="إلى" surah={s.hifzToSurah} ayah={s.hifzToAyah}
                            onSurahChange={(v) => updateStudent(idx, "hifzToSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "hifzToAyah", v)} />
                        </div>
                      </div>
                    )}
                    {showNear && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{nearLabel}</Badge>
                          <FacesBadge from={s.nearFromSurah} fa={s.nearFromAyah} to={s.nearToSurah} ta={s.nearToAyah} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <SurahAyahPicker label="من" surah={s.nearFromSurah} ayah={s.nearFromAyah}
                            onSurahChange={(v) => updateStudent(idx, "nearFromSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "nearFromAyah", v)} />
                          <SurahAyahPicker label="إلى" surah={s.nearToSurah} ayah={s.nearToAyah}
                            onSurahChange={(v) => updateStudent(idx, "nearToSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "nearToAyah", v)} />
                        </div>
                      </div>
                    )}
                    {showFar && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">مراجعة بعيدة</Badge>
                          <FacesBadge from={s.farFromSurah} fa={s.farFromAyah} to={s.farToSurah} ta={s.farToAyah} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <SurahAyahPicker label="من" surah={s.farFromSurah} ayah={s.farFromAyah}
                            onSurahChange={(v) => updateStudent(idx, "farFromSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "farFromAyah", v)} />
                          <SurahAyahPicker label="إلى" surah={s.farToSurah} ayah={s.farToAyah}
                            onSurahChange={(v) => updateStudent(idx, "farToSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "farToAyah", v)} />
                        </div>
                      </div>
                    )}
                    {showTilawa && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">تلاوة</Badge>
                          <FacesBadge from={s.tilawaFromSurah} fa={s.tilawaFromAyah} to={s.tilawaToSurah} ta={s.tilawaToAyah} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <SurahAyahPicker label="من" surah={s.tilawaFromSurah} ayah={s.tilawaFromAyah}
                            onSurahChange={(v) => updateStudent(idx, "tilawaFromSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "tilawaFromAyah", v)} />
                          <SurahAyahPicker label="إلى" surah={s.tilawaToSurah} ayah={s.tilawaToAyah}
                            onSurahChange={(v) => updateStudent(idx, "tilawaToSurah", v)}
                            onAyahChange={(v) => updateStudent(idx, "tilawaToAyah", v)} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
            <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
              <Save className="h-4 w-4 ml-2" />
              {saving ? "جارِ الحفظ..." : "حفظ جميع البيانات"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
