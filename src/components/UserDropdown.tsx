import { useState, useEffect } from "react";
import { LogOut, User, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export const UserDropdown = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
      // Try to get from user metadata if profile doesn't exist yet
      const metadata = user.user_metadata;
      setProfile({
        first_name: metadata?.first_name || null,
        last_name: metadata?.last_name || null,
        avatar_url: metadata?.avatar_url || null,
      });
    }
  };

  if (!user) return null;

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    // Fallback to email
    return (user.email || "").substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user.email;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-8 w-8 cursor-pointer border-2 border-border hover:border-primary transition-colors">
          {profile?.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={getDisplayName() || "User"} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border-border z-50">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{getDisplayName()}</p>
            {profile?.first_name && profile?.last_name && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer">
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
