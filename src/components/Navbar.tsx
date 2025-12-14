import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, Menu } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSectionScroll = (sectionId: string) => {
    setOpen(false);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const NavLinks = () => (
    <>
      {user && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleNavigation("/projects")} 
          className="text-sm w-full md:w-auto justify-start md:justify-center"
        >
          Projects
        </Button>
      )}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleSectionScroll("features")} 
        className="text-sm w-full md:w-auto justify-start md:justify-center"
      >
        Features
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleSectionScroll("how-it-works")} 
        className="text-sm w-full md:w-auto justify-start md:justify-center"
      >
        How It Works
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleNavigation("/pricing")} 
        className="text-sm w-full md:w-auto justify-start md:justify-center"
      >
        Pricing
      </Button>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center cursor-pointer group" onClick={() => navigate("/")}>
          <span className="text-xl font-bold text-brand-gradient">specmaster</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavLinks />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 px-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Desktop Auth Buttons */}
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline-flex mr-2">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks />
                
                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <span className="text-sm text-muted-foreground px-4">{user.email}</span>
                      <Button onClick={() => { signOut(); setOpen(false); }} variant="outline" className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => handleNavigation("/auth")} variant="outline" className="w-full">
                        Sign In
                      </Button>
                      <Button onClick={() => handleNavigation("/auth")} className="w-full">
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
