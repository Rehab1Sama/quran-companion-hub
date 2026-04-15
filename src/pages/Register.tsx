import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type Track = Database["public"]["Tables"]["tracks"]["Row"];
type Halaqah = Database["public"]["Tables"]["halaqat"]["Row"];

export default function Register() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [halaqat, setHalaqat] = useState<Halaqah[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [hifzDirection, setHifzDirection] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedHalaqah, setSelectedHalaqah] = useState("");
  const [role, setRole] = useState("student");

  useEffect(() => {
    supabase.from("tracks").select("*").then(({ data }) => data && setTracks(data));
    supabase.from("halaqat").select("*").then(({ data }) => data && setHalaqat(data));
  }, []);

  const filteredHalaqat = halaqat.filter((h) => h.track_id === selectedTrack && h.name !== "التسجيل");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast({ title: "خطأ في التسجيل", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    if (data.user) {
      // Update profile
      await supabase.from("profiles").update({
        age, phone, whatsapp, country, education_level: educationLevel,
        hifz_direction: hifzDirection as any || null,
      }).eq("user_id", data.user.id);

      // Assign halaqah membership
      if (selectedHalaqah) {
        await supabase.from("halaqah_members").insert({
          user_id: data.user.id,
          halaqah_id: selectedHalaqah,
          role: role as any,
        });
      }
    }
    toast({ title: "تم التسجيل بنجاح", description: "تحقق من بريدك الإلكتروني لتأكيد الحساب" });
    navigate("/login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-primary">تسجيل حساب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">الحاليات</TabsTrigger>
              <TabsTrigger value="new">المستجدات</TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>الاسم الكامل</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>العمر</Label>
                    <Select value={age} onValueChange={setAge}>
                      <SelectTrigger><SelectValue placeholder="اختاري" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => i + 5).map((a) => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>الجوال</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label>واتساب</Label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>البلد</Label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>المستوى الدراسي</Label>
                    <Input value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>الدور</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">طالبة</SelectItem>
                      <SelectItem value="teacher">معلمة</SelectItem>
                      <SelectItem value="supervisor">مشرفة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {role === "student" && (
                  <div className="space-y-1">
                    <Label>اتجاه الحفظ</Label>
                    <Select value={hifzDirection} onValueChange={setHifzDirection}>
                      <SelectTrigger><SelectValue placeholder="اختاري" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="from_baqarah">من البقرة</SelectItem>
                        <SelectItem value="from_nas">من الناس</SelectItem>
                        <SelectItem value="both">كلاهما</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>المسار</Label>
                    <Select value={selectedTrack} onValueChange={(v) => { setSelectedTrack(v); setSelectedHalaqah(""); }}>
                      <SelectTrigger><SelectValue placeholder="اختاري" /></SelectTrigger>
                      <SelectContent>
                        {tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>الحلقة</Label>
                    <Select value={selectedHalaqah} onValueChange={setSelectedHalaqah}>
                      <SelectTrigger><SelectValue placeholder="اختاري" /></SelectTrigger>
                      <SelectContent>
                        {filteredHalaqat.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label>كلمة المرور</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جارِ التسجيل..." : "تسجيل"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="new">
              <div className="text-center py-8 text-muted-foreground">
                <p>التسجيل للمستجدات مغلق حالياً</p>
                <p className="text-xs mt-2">يتم فتحه من قبل القائدة عند الحاجة</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
