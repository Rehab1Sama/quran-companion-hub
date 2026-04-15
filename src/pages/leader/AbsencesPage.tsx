import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { Badge } from "@/components/ui/badge";

export default function AbsencesPage() {
  const [todayAbsent, setTodayAbsent] = useState<any[]>([]);
  const [frequent, setFrequent] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayRecs } = await supabase
        .from("daily_records")
        .select("student_id")
        .eq("record_date", today)
        .eq("is_absent", true);

      if (todayRecs && todayRecs.length > 0) {
        const ids = [...new Set(todayRecs.map((r) => r.student_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", ids);
        setTodayAbsent(profiles || []);
      }

      // Frequent absentees (last 30 days, 3+ times)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: allAbsent } = await supabase
        .from("daily_records")
        .select("student_id")
        .eq("is_absent", true)
        .gte("record_date", thirtyDaysAgo.toISOString().split("T")[0]);

      if (allAbsent) {
        const countMap: Record<string, number> = {};
        allAbsent.forEach((r) => { countMap[r.student_id] = (countMap[r.student_id] || 0) + 1; });
        const frequentIds = Object.entries(countMap).filter(([, c]) => c >= 3).map(([id]) => id);
        if (frequentIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", frequentIds);
          setFrequent((profiles || []).map((p) => ({ ...p, absenceCount: countMap[p.user_id] })));
        }
      }
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الغيابات</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              غائبات اليوم
              <Badge variant="destructive">{todayAbsent.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAbsent.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">لا توجد غائبات اليوم 🎉</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الجوال</TableHead>
                    <TableHead>واتساب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAbsent.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell dir="ltr">{p.phone || "—"}</TableCell>
                      <TableCell>
                        <WhatsAppButton number={p.whatsapp} name={p.full_name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">متكررات الغياب (٣+ مرات خلال ٣٠ يوم)</CardTitle>
          </CardHeader>
          <CardContent>
            {frequent.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">لا يوجد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>عدد مرات الغياب</TableHead>
                    <TableHead>واتساب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frequent.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{p.absenceCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <WhatsAppButton number={p.whatsapp} name={p.full_name} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
