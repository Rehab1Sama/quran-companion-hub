import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPages } from "@/lib/quran-data";
import { BookOpen, Eye, EyeOff, Users, AlertTriangle } from "lucide-react";

export default function StatisticsPage() {
  const [period, setPeriod] = useState("week");
  const [stats, setStats] = useState({
    totalHifz: 0, totalNearReview: 0, totalFarReview: 0, totalTilawa: 0,
    totalStudents: 0, totalAbsent: 0, topHalaqah: "",
  });

  useEffect(() => {
    const fetch = async () => {
      const now = new Date();
      let fromDate: string;
      if (period === "week") {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        fromDate = d.toISOString().split("T")[0];
      } else if (period === "month") {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        fromDate = d.toISOString().split("T")[0];
      } else {
        fromDate = "2020-01-01";
      }

      const { data: records } = await supabase
        .from("daily_records")
        .select("*")
        .gte("record_date", fromDate);

      const { data: members } = await supabase
        .from("halaqah_members")
        .select("id", { count: "exact" })
        .eq("role", "student")
        .eq("is_archived", false);

      const { data: halaqat } = await supabase.from("halaqat").select("id, name");

      if (records) {
        const totalHifz = records.reduce((s, r) => s + (r.hifz_pages || 0), 0);
        const totalNearReview = records.reduce((s, r) => s + (r.near_review_pages || 0), 0);
        const totalFarReview = records.reduce((s, r) => s + (r.far_review_pages || 0), 0);
        const totalTilawa = records.reduce((s, r) => s + (r.tilawa_pages || 0), 0);
        const totalAbsent = records.filter((r) => r.is_absent).length;

        // Top halaqah by hifz
        const halaqahHifz: Record<string, number> = {};
        records.forEach((r) => {
          halaqahHifz[r.halaqah_id] = (halaqahHifz[r.halaqah_id] || 0) + (r.hifz_pages || 0);
        });
        const topId = Object.entries(halaqahHifz).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topHalaqah = halaqat?.find((h) => h.id === topId)?.name || "—";

        setStats({
          totalHifz, totalNearReview, totalFarReview, totalTilawa,
          totalStudents: members?.length || 0, totalAbsent, topHalaqah,
        });
      }
    };
    fetch();
  }, [period]);

  const statCards = [
    { title: "أوجه الحفظ", value: formatPages(stats.totalHifz), icon: BookOpen, color: "text-primary" },
    { title: "مراجعة قريبة", value: formatPages(stats.totalNearReview), icon: Eye, color: "text-accent-foreground" },
    { title: "مراجعة بعيدة", value: formatPages(stats.totalFarReview), icon: EyeOff, color: "text-muted-foreground" },
    { title: "تلاوة", value: formatPages(stats.totalTilawa), icon: BookOpen, color: "text-success" },
    { title: "عدد الطالبات", value: String(stats.totalStudents), icon: Users, color: "text-primary" },
    { title: "مجموع الغياب", value: String(stats.totalAbsent), icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">الإحصائيات</h2>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">أسبوع</SelectItem>
              <SelectItem value="month">شهر</SelectItem>
              <SelectItem value="all">الكل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الحلقة الأكثر إنجازاً</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-primary">{stats.topHalaqah}</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
