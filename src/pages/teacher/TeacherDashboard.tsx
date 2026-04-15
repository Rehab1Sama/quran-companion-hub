import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPages } from "@/lib/quran-data";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Get teacher's halaqat
      const { data: memberships } = await supabase
        .from("halaqah_members")
        .select("halaqah_id")
        .eq("user_id", user.id)
        .in("role", ["teacher", "supervisor"]);

      if (!memberships?.length) return;
      const halaqahIds = memberships.map((m) => m.halaqah_id);

      // Get students in those halaqat
      const { data: studs } = await supabase
        .from("halaqah_members")
        .select("user_id, profiles!halaqah_members_user_id_fkey(full_name)")
        .in("halaqah_id", halaqahIds)
        .eq("role", "student")
        .eq("is_archived", false);
      setStudents(studs || []);

      const now = new Date();
      let fromDate: string;
      if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); fromDate = d.toISOString().split("T")[0]; }
      else if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); fromDate = d.toISOString().split("T")[0]; }
      else { fromDate = "2020-01-01"; }

      const { data: recs } = await supabase
        .from("daily_records")
        .select("*")
        .in("halaqah_id", halaqahIds)
        .gte("record_date", fromDate);
      setRecords(recs || []);
    };
    fetch();
  }, [user, period]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">حلقتي</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">أسبوع</SelectItem>
              <SelectItem value="month">شهر</SelectItem>
              <SelectItem value="all">الكل</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالبة</TableHead>
                  <TableHead>حفظ</TableHead>
                  <TableHead>مراجعة قريبة</TableHead>
                  <TableHead>مراجعة بعيدة</TableHead>
                  <TableHead>غياب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const recs = records.filter((r) => r.student_id === s.user_id);
                  const hifz = recs.reduce((sum, r) => sum + (r.hifz_pages || 0), 0);
                  const near = recs.reduce((sum, r) => sum + (r.near_review_pages || 0), 0);
                  const far = recs.reduce((sum, r) => sum + (r.far_review_pages || 0), 0);
                  const absent = recs.filter((r) => r.is_absent).length;
                  return (
                    <TableRow key={s.user_id}>
                      <TableCell className="font-medium">{(s as any).profiles?.full_name}</TableCell>
                      <TableCell>{formatPages(hifz)}</TableCell>
                      <TableCell>{formatPages(near)}</TableCell>
                      <TableCell>{formatPages(far)}</TableCell>
                      <TableCell>{absent}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
