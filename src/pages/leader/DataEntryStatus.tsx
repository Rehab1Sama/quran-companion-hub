import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export default function DataEntryStatus() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [todayStatus, setTodayStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: assigns } = await supabase
        .from("data_entry_assignments")
        .select("*, profiles!data_entry_assignments_user_id_fkey(full_name), tracks!data_entry_assignments_track_id_fkey(name)");

      if (assigns) {
        setAssignments(assigns);
        // Check if each data entry user has entered data today
        const status: Record<string, boolean> = {};
        for (const a of assigns) {
          const { count } = await supabase
            .from("daily_records")
            .select("id", { count: "exact" })
            .eq("entered_by", a.user_id)
            .eq("record_date", today);
          status[a.user_id] = (count || 0) > 0;
        }
        setTodayStatus(status);
      }
    };
    fetch();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">حالة المُدخلات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <Card key={a.id} className={`border-2 ${todayStatus[a.user_id] ? "border-success/30" : "border-destructive/30"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{(a as any).profiles?.full_name || "—"}</span>
                  {todayStatus[a.user_id] ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{(a as any).tracks?.name}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  {todayStatus[a.user_id] ? "أدخلت بيانات اليوم ✓" : "لم تُدخل بيانات اليوم ✗"}
                </p>
              </CardContent>
            </Card>
          ))}
          {assignments.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">لا توجد مدخلات مُسجّلة</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
