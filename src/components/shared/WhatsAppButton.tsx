import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsAppButton({ number, name }: { number?: string | null; name?: string }) {
  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  const msg = name ? `السلام عليكم ${name}` : "السلام عليكم";
  return (
    <Button
      variant="outline"
      size="icon"
      className="text-success border-success/30 hover:bg-success/10"
      asChild
    >
      <a href={`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" />
      </a>
    </Button>
  );
}
