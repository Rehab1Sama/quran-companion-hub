import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RegistrationPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("registration_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) {
        setIsOpen(data.is_open);
        setSettingsId(data.id);
      }
    });
  }, []);

  const toggleRegistration = async (open: boolean) => {
    if (!settingsId) return;
    const { error } = await supabase.from("registration_settings").update({ is_open: open }).eq("id", settingsId);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      setIsOpen(open);
      toast({ title: open ? "تم فتح التسجيل" : "تم إغلاق التسجيل" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">إدارة التسجيل</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تسجيل المستجدات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch id="reg-switch" checked={isOpen} onCheckedChange={toggleRegistration} />
              <Label htmlFor="reg-switch" className="text-sm">
                {isOpen ? "التسجيل مفتوح ✓" : "التسجيل مغلق ✗"}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              عند فتح التسجيل، ستظهر استمارة التسجيل للمستجدات وسيتم إضافتهن تلقائياً في حلقة "التسجيل"
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
