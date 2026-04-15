import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-cairo">جارِ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (hasRole("leader")) return <Navigate to="/dashboard" replace />;
  if (hasRole("data_entry")) return <Navigate to="/data-entry" replace />;
  if (hasRole("teacher") || hasRole("supervisor")) return <Navigate to="/teacher" replace />;
  if (hasRole("track_manager")) return <Navigate to="/halaqat" replace />;
  return <Navigate to="/student" replace />;
}
