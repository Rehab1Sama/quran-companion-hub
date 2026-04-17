import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { formatFaces } from "@/lib/quran-data";
import { BookOpen, Eye, EyeOff, Users, AlertTriangle } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer,
} from "recharts";

type PeriodKey = "week" | "month" | "all";

interface Track { id: string; name: string; type: string }
interface Halaqah { id: string; name: string; track_id: string }
interface Record_ {
  halaqah_id: string;
  record_date: string;
  is_absent: boolean;
  hifz_pages: number | null;
  near_review_pages: number | null;
  far_review_pages: number | null;
  tilawa_pages: number | null;
}

const pagesToFaces = (p: number | null | undefined) => (Number(p) || 0) * 2;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 = Sun
  x.setDate(x.getDate() - day);
  return x;
}

const chartConfig = {
  hifz: { label: "حفظ", color: "hsl(var(--primary))" },
  near: { label: "مراجعة قريبة", color: "hsl(var(--accent-foreground))" },
  far: { label: "مراجعة بعيدة", color: "hsl(var(--muted-foreground))" },
  tilawa: { label: "تلاوة", color: "hsl(var(--success, 142 71% 45%))" },
  total: { label: "الإجمالي", color: "hsl(var(--primary))" },
};

export default function StatisticsPage() {
  const [period, setPeriod] = useState<PeriodKey>("week");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [halaqat, setHalaqat] = useState<Halaqah[]>([]);
  const [records, setRecords] = useState<Record_[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      let fromDate: string;
      if (period === "week") {
        const d = new Date(now); d.setDate(d.getDate() - 7);
        fromDate = d.toISOString().split("T")[0];
      } else if (period === "month") {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        fromDate = d.toISOString().split("T")[0];
      } else {
        fromDate = "2020-01-01";
      }

      const [recRes, tracksRes, halaqatRes, membersRes] = await Promise.all([
        supabase.from("daily_records").select("halaqah_id, record_date, is_absent, hifz_pages, near_review_pages, far_review_pages, tilawa_pages").gte("record_date", fromDate),
        supabase.from("tracks").select("id, name, type"),
        supabase.from("halaqat").select("id, name, track_id"),
        supabase.from("halaqah_members").select("id", { count: "exact", head: true }).eq("role", "student").eq("is_archived", false),
      ]);

      setRecords((recRes.data || []) as Record_[]);
      setTracks((tracksRes.data || []) as Track[]);
      setHalaqat((halaqatRes.data || []) as Halaqah[]);
      setStudentCount(membersRes.count || 0);
    };
    load();
  }, [period]);

  const halaqahToTrack = useMemo(() => {
    const m = new Map<string, string>();
    halaqat.forEach((h) => m.set(h.id, h.track_id));
    return m;
  }, [halaqat]);

  const totals = useMemo(() => {
    let h = 0, n = 0, f = 0, t = 0, abs = 0;
    records.forEach((r) => {
      h += pagesToFaces(r.hifz_pages);
      n += pagesToFaces(r.near_review_pages);
      f += pagesToFaces(r.far_review_pages);
      t += pagesToFaces(r.tilawa_pages);
      if (r.is_absent) abs += 1;
    });
    return { hifz: h, near: n, far: f, tilawa: t, absent: abs };
  }, [records]);

  // Per-track totals (faces)
  const trackData = useMemo(() => {
    const map = new Map<string, { name: string; hifz: number; near: number; far: number; tilawa: number; total: number }>();
    tracks.forEach((tr) => map.set(tr.id, { name: tr.name, hifz: 0, near: 0, far: 0, tilawa: 0, total: 0 }));
    records.forEach((r) => {
      const trackId = halaqahToTrack.get(r.halaqah_id);
      if (!trackId) return;
      const row = map.get(trackId);
      if (!row) return;
      const h = pagesToFaces(r.hifz_pages);
      const n = pagesToFaces(r.near_review_pages);
      const f = pagesToFaces(r.far_review_pages);
      const tl = pagesToFaces(r.tilawa_pages);
      row.hifz += h; row.near += n; row.far += f; row.tilawa += tl;
      row.total += h + n + f + tl;
    });
    return Array.from(map.values()).filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  }, [records, tracks, halaqahToTrack]);

  // Per-halaqah totals (faces)
  const halaqahData = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    halaqat.forEach((h) => map.set(h.id, { name: h.name, total: 0 }));
    records.forEach((r) => {
      const row = map.get(r.halaqah_id);
      if (!row) return;
      row.total += pagesToFaces(r.hifz_pages) + pagesToFaces(r.near_review_pages) + pagesToFaces(r.far_review_pages) + pagesToFaces(r.tilawa_pages);
    });
    return Array.from(map.values()).filter((r) => r.total > 0 && r.name !== "التسجيل").sort((a, b) => b.total - a.total).slice(0, 12);
  }, [records, halaqat]);

  // Time series: daily for week, weekly for month, monthly for all
  const timeSeries = useMemo(() => {
    const buckets = new Map<string, { label: string; sortKey: string; hifz: number; near: number; far: number; tilawa: number }>();
    records.forEach((r) => {
      const d = new Date(r.record_date);
      let key: string; let label: string;
      if (period === "week") {
        key = r.record_date;
        label = d.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric" });
      } else if (period === "month") {
        const ws = startOfWeek(d);
        key = ws.toISOString().split("T")[0];
        label = `أسبوع ${ws.getDate()}/${ws.getMonth() + 1}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        label = d.toLocaleDateString("ar-SA", { year: "numeric", month: "short" });
      }
      if (!buckets.has(key)) buckets.set(key, { label, sortKey: key, hifz: 0, near: 0, far: 0, tilawa: 0 });
      const row = buckets.get(key)!;
      row.hifz += pagesToFaces(r.hifz_pages);
      row.near += pagesToFaces(r.near_review_pages);
      row.far += pagesToFaces(r.far_review_pages);
      row.tilawa += pagesToFaces(r.tilawa_pages);
    });
    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [records, period]);

  const statCards = [
    { title: "أوجه الحفظ", value: formatFaces(totals.hifz), icon: BookOpen, color: "text-primary" },
    { title: "مراجعة قريبة", value: formatFaces(totals.near), icon: Eye, color: "text-accent-foreground" },
    { title: "مراجعة بعيدة", value: formatFaces(totals.far), icon: EyeOff, color: "text-muted-foreground" },
    { title: "تلاوة", value: formatFaces(totals.tilawa), icon: BookOpen, color: "text-foreground" },
    { title: "عدد الطالبات", value: String(studentCount), icon: Users, color: "text-primary" },
    { title: "مجموع الغياب", value: String(totals.absent), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">الإحصائيات</h2>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
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
            <CardTitle className="text-base">
              {period === "week" ? "إنجاز يومي (أوجه)" : period === "month" ? "إنجاز أسبوعي (أوجه)" : "إنجاز شهري (أوجه)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeSeries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="hifz" stroke="var(--color-hifz)" strokeWidth={2} />
                  <Line type="monotone" dataKey="near" stroke="var(--color-near)" strokeWidth={2} />
                  <Line type="monotone" dataKey="far" stroke="var(--color-far)" strokeWidth={2} />
                  <Line type="monotone" dataKey="tilawa" stroke="var(--color-tilawa)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">مقارنة المسارات (مجموع الأوجه)</CardTitle>
          </CardHeader>
          <CardContent>
            {trackData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart data={trackData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="hifz" stackId="a" fill="var(--color-hifz)" />
                  <Bar dataKey="near" stackId="a" fill="var(--color-near)" />
                  <Bar dataKey="far" stackId="a" fill="var(--color-far)" />
                  <Bar dataKey="tilawa" stackId="a" fill="var(--color-tilawa)" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">أعلى الحلقات إنجازاً</CardTitle>
          </CardHeader>
          <CardContent>
            {halaqahData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart data={halaqahData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
