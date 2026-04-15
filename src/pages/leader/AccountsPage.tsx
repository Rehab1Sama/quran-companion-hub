import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { Search, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").eq("is_archived", false);
      const { data: roles } = await supabase.from("user_roles").select("*");
      if (profiles && roles) {
        const roleMap: Record<string, string[]> = {};
        roles.forEach((r) => {
          if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
          roleMap[r.user_id].push(r.role);
        });
        setUsers(profiles.map((p) => ({ ...p, roles: roleMap[p.user_id] || [] })));
      }
    };
    fetch();
  }, []);

  const roleLabels: Record<string, string> = {
    leader: "قائدة", data_entry: "مدخلة", teacher: "معلمة",
    supervisor: "مشرفة", track_manager: "مسؤولة مسار", student: "طالبة",
  };

  const filtered = users.filter((u) =>
    u.full_name.includes(search) || u.phone?.includes(search) || u.whatsapp?.includes(search)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">الحسابات</h2>
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحثي بالاسم أو الرقم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الجوال</TableHead>
                  <TableHead>البريد</TableHead>
                  <TableHead>واتساب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r: string) => (
                          <Badge key={r} variant="outline" className="text-xs">{roleLabels[r] || r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell dir="ltr" className="text-left">{u.phone || "—"}</TableCell>
                    <TableCell dir="ltr" className="text-left text-xs">{u.user_id ? "—" : "—"}</TableCell>
                    <TableCell>
                      <WhatsAppButton number={u.whatsapp} name={u.full_name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
