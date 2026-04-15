import {
  BookOpen,
  Users,
  BarChart3,
  ClipboardList,
  UserCog,
  UserPlus,
  AlertTriangle,
  GraduationCap,
  PenSquare,
  Home,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const leaderItems = [
  { title: "الرئيسية", url: "/dashboard", icon: Home },
  { title: "الحلقات", url: "/halaqat", icon: BookOpen },
  { title: "المُدخلات", url: "/data-entry-status", icon: ClipboardList },
  { title: "الحسابات", url: "/accounts", icon: UserCog },
  { title: "الإحصائيات", url: "/statistics", icon: BarChart3 },
  { title: "التسجيل", url: "/registration", icon: UserPlus },
  { title: "الغيابات", url: "/absences", icon: AlertTriangle },
];

const dataEntryItems = [
  { title: "إدخال البيانات", url: "/data-entry", icon: PenSquare },
];

const teacherItems = [
  { title: "حلقتي", url: "/teacher", icon: GraduationCap },
];

const studentItems = [
  { title: "إنجازاتي", url: "/student", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasRole, profile, signOut } = useAuth();

  let items = studentItems;
  if (hasRole("leader")) items = leaderItems;
  else if (hasRole("data_entry")) items = dataEntryItems;
  else if (hasRole("teacher") || hasRole("supervisor")) items = teacherItems;
  else if (hasRole("track_manager")) items = [...leaderItems.filter(i => ["/halaqat", "/statistics"].includes(i.url))];

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="text-lg font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                سنا الآي
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-bold"
                    >
                      <item.icon className="h-4 w-4 ml-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && profile && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {profile.full_name}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "تسجيل خروج"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
