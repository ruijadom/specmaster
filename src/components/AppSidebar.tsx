import { useState, useEffect } from "react";
import { 
  FolderKanban, 
  Settings, 
  UserCircle, 
  Moon, 
  Sun, 
  LogOut,
  Monitor,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const menuItems = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Documentation", url: "/docs", icon: BookOpen },
  { title: "Account", url: "/account", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const isCollapsed = state === "collapsed";

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    } else {
      const metadata = user?.user_metadata;
      setProfile({
        first_name: metadata?.first_name || null,
        last_name: metadata?.last_name || null,
        avatar_url: metadata?.avatar_url || null,
      });
    }
  };

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    return (user?.email || "U").substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || "User";
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="h-14 border-b border-sidebar-border flex justify-center items-center">
        <div className="flex items-center justify-between px-2 w-full">
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center"
          >
            <span className={cn(
              "font-bold text-brand-gradient text-lg",
              isCollapsed ? "-ml-1" : "ml-0"
            )}>
              {isCollapsed ? "sm" : "specmaster"}
            </span>
          </button>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Toggle and User Dropdown */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Sidebar Toggle */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarTrigger className="w-full justify-start h-8 px-2" />
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User Dropdown */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0 border border-sidebar-border">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {getDisplayName()}
                    </span>
                    {!isCollapsed && user?.email && profile?.first_name && (
                      <span className="text-xs text-sidebar-foreground/60 truncate max-w-[120px]">
                        {user.email}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="end" 
                sideOffset={8}
                className="w-64 bg-popover border-border z-50"
              >
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => navigate("/settings")} 
                  className="cursor-pointer py-2.5"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-2.5">
                    <Monitor className="mr-3 h-4 w-4" />
                    <span>Appearance</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-popover border-border z-50">
                      <DropdownMenuItem 
                        onClick={() => setTheme("light")}
                        className={cn("cursor-pointer py-2", theme === "light" && "bg-accent")}
                      >
                        <Sun className="mr-3 h-4 w-4" />
                        <span>Light</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setTheme("dark")}
                        className={cn("cursor-pointer py-2", theme === "dark" && "bg-accent")}
                      >
                        <Moon className="mr-3 h-4 w-4" />
                        <span>Dark</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setTheme("system")}
                        className={cn("cursor-pointer py-2", theme === "system" && "bg-accent")}
                      >
                        <Monitor className="mr-3 h-4 w-4" />
                        <span>System</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={signOut} 
                  className="cursor-pointer py-2.5 text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
