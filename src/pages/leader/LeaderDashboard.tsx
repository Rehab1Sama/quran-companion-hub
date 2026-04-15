import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, AlertTriangle } from "lucide-react";

export default function LeaderDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, halaqat: 0, todayRecords: 0, todayAbsent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [members, halaqat, records] = await Promise.all([
        supabase.from("halaqah_members").select("id", { count: "exact" }).eq("role", "student").eq("is_archived", false),
        supabase.from("halaqat").select("id", { count: "exact" }),
        supabase.from("daily_records").select("id, is_absent").eq("record_date", today),
      ]);
      setStats({
        students: members.count || 0,
        halaqat: halaqat.count || 0,
        todayRecords: records.data?.length || 0,
        todayAbsent: records.data?.filter((r) => r.is_absent).length || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "الطالبات", value: stats.students, icon: Users, color: "text-primary" },
    { title: "الحلقات", value: stats.halaqat, icon: BookOpen, color: "text-accent" },
    { title: "إدخالات اليوم", value: stats.todayRecords, icon: BarChart3, color: "text-success" },
    { title: "غائبات اليوم", value: stats.todayAbsent, icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          مرحباً {profile?.full_name} 👋
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.title} className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
