import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { formatPages } from "@/lib/quran-data";

export default function HalaqatPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedHalaqah, setSelectedHalaqah] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("tracks").select("*").then(({ data }) => data && setTracks(data));
    supabase.from("halaqat").select("*").then(({ data }) => data && setHalaqat(data));
  }, []);

  useEffect(() => {
    if (!selectedHalaqah) return;
    const fetchMembers = async () => {
      const { data: mems } = await supabase
        .from("halaqah_members")
        .select("*, profiles!halaqah_members_user_id_fkey(full_name, whatsapp)")
        .eq("halaqah_id", selectedHalaqah)
        .eq("is_archived", false);
      setMembers(mems || []);

      const { data: recs } = await supabase
        .from("daily_records")
        .select("*")
        .eq("halaqah_id", selectedHalaqah)
        .order("record_date", { ascending: false })
        .limit(100);
      setRecords(recs || []);
    };
    fetchMembers();
  }, [selectedHalaqah]);

  const filteredHalaqat = halaqat.filter((h) => h.track_id === selectedTrack && h.name !== "التسجيل");
  const students = members.filter((m) => m.role === "student");
  const teachers = members.filter((m) => m.role === "teacher" || m.role === "supervisor");

  const getStudentRecords = (userId: string) => records.filter((r) => r.student_id === userId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الحلقات</h2>
        <div className="flex gap-4 flex-wrap">
          <Select value={selectedTrack} onValueChange={(v) => { setSelectedTrack(v); setSelectedHalaqah(""); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="اختر المسار" /></SelectTrigger>
            <SelectContent>
              {tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedHalaqah} onValueChange={setSelectedHalaqah}>
            <SelectTrigger className="w-48"><SelectValue placeholder="اختر الحلقة" /></SelectTrigger>
            <SelectContent>
              {filteredHalaqat.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedHalaqah && (
          <>
            {teachers.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">المعلمات والمشرفات</CardTitle></CardHeader>
                <CardContent className="flex gap-3 flex-wrap">
                  {teachers.map((t) => (
                    <Badge key={t.id} variant="secondary" className="text-sm py-1 px-3">
                      {(t as any).profiles?.full_name || "—"}
                      <span className="mr-1 text-xs text-muted-foreground">({t.role === "teacher" ? "معلمة" : "مشرفة"})</span>
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-sm">الطالبات ({students.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>حفظ</TableHead>
                      <TableHead>مراجعة قريبة</TableHead>
                      <TableHead>مراجعة بعيدة</TableHead>
                      <TableHead>واتساب</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => {
                      const recs = getStudentRecords(s.user_id);
                      const totalHifz = recs.reduce((sum, r) => sum + (r.hifz_pages || 0), 0);
                      const totalNear = recs.reduce((sum, r) => sum + (r.near_review_pages || 0), 0);
                      const totalFar = recs.reduce((sum, r) => sum + (r.far_review_pages || 0), 0);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{(s as any).profiles?.full_name || "—"}</TableCell>
                          <TableCell>{formatPages(totalHifz)}</TableCell>
                          <TableCell>{formatPages(totalNear)}</TableCell>
                          <TableCell>{formatPages(totalFar)}</TableCell>
                          <TableCell>
                            <WhatsAppButton number={(s as any).profiles?.whatsapp} name={(s as any).profiles?.full_name} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
