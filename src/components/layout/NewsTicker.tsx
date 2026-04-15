import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface TickerItem {
  name: string;
  absentCount: number;
}

export default function NewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetchTopHalaqat = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: halaqat } = await supabase.from("halaqat").select("id, name");
      if (!halaqat) return;

      const { data: records } = await supabase
        .from("daily_records")
        .select("halaqah_id, is_absent")
        .eq("record_date", today)
        .eq("is_absent", true);

      const absentMap: Record<string, number> = {};
      records?.forEach((r) => {
        absentMap[r.halaqah_id] = (absentMap[r.halaqah_id] || 0) + 1;
      });

      const sorted = halaqat
        .map((h) => ({ name: h.name, absentCount: absentMap[h.id] || 0 }))
        .sort((a, b) => a.absentCount - b.absentCount)
        .slice(0, 5);

      setItems(sorted);
    };

    fetchTopHalaqat();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-gradient-to-l from-primary/10 via-accent/20 to-primary/10 border-b border-border overflow-hidden py-2">
      <div className="flex items-center gap-3">
        <span className="shrink-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Star className="h-3 w-3" />
          الحلقات المتميزة لليوم
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-6 animate-ticker whitespace-nowrap">
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-primary border border-primary/20"
              >
                ⭐ {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
