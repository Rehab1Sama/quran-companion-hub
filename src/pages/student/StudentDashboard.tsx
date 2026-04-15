import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPages } from "@/lib/quran-data";
import { BookOpen, Eye, EyeOff } from "lucide-react";

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ hifz: 0, near: 0, far: 0, tilawa: 0, totalDays: 0, absentDays: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("daily_records").select("*").eq("student_id", user.id).then(({ data }) => {
      if (!data) return;
      setStats({
        hifz: data.reduce((s, r) => s + (r.hifz_pages || 0), 0),
        near: data.reduce((s, r) => s + (r.near_review_pages || 0), 0),
        far: data.reduce((s, r) => s + (r.far_review_pages || 0), 0),
        tilawa: data.reduce((s, r) => s + (r.tilawa_pages || 0), 0),
        totalDays: data.length,
        absentDays: data.filter((r) => r.is_absent).length,
      });
    });
  }, [user]);

  const totalPages = 604; // Total Quran pages
  const progress = Math.min((stats.hifz / totalPages) * 100, 100);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">مرحباً {profile?.full_name} 🌟</h2>

        <Card className="bg-gradient-to-l from-primary/5 to-accent/5">
          <CardHeader><CardTitle className="text-base">تقدم الحفظ</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {formatPages(stats.hifz)} من {totalPages} وجه ({progress.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-primary" /> حفظ
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">{formatPages(stats.hifz)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <Eye className="h-4 w-4 text-accent-foreground" /> مراجعة قريبة
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-accent-foreground">{formatPages(stats.near)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <EyeOff className="h-4 w-4" /> مراجعة بعيدة
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatPages(stats.far)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-success" /> تلاوة
              </CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold text-success">{formatPages(stats.tilawa)}</p></CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
