import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type VerificationStatus = "pending" | "loading" | "verified" | "set-password" | "success" | "error";

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isInvite, setIsInvite] = useState(false);
  
  // Password form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  // Get token_hash and type from URL params or hash
  const getTokenFromUrl = () => {
    // First check URL params
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    
    if (tokenHash && type) {
      return { tokenHash, type };
    }

    // Then check hash fragment (for redirect URLs)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashTokenHash = hashParams.get("token_hash");
      const hashType = hashParams.get("type");
      
      if (hashTokenHash && hashType) {
        return { tokenHash: hashTokenHash, type: hashType };
      }

      // Check for error in hash
      const error = hashParams.get("error");
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");
      
      if (error) {
        return { 
          error: true, 
          errorCode, 
          errorDescription: errorDescription?.replace(/\+/g, " ") 
        };
      }
    }

    return null;
  };

  useEffect(() => {
    const urlData = getTokenFromUrl();
    
    if (urlData && 'error' in urlData) {
      setStatus("error");
      setErrorMessage(urlData.errorDescription || "Email verification failed");
    } else if (urlData && 'type' in urlData) {
      setIsInvite(urlData.type === "invite");
    }
  }, []);

  const handleConfirmEmail = async () => {
    const urlData = getTokenFromUrl();
    
    if (!urlData || 'error' in urlData) {
      setStatus("error");
      setErrorMessage("Invalid or missing verification token");
      return;
    }

    const { tokenHash, type } = urlData;

    setStatus("loading");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "signup" | "invite" | "recovery" | "email_change",
      });

      if (error) {
        setStatus("error");
        if (error.message.includes("expired")) {
          setErrorMessage("This verification link has expired. Please request a new invitation.");
        } else {
          setErrorMessage(error.message);
        }
        toast.error("Verification failed", { description: error.message });
      } else {
        // If it's an invite, user needs to set password
        if (type === "invite") {
          setStatus("set-password");
          toast.success("Email verified! Please set your password.");
        } else {
          setStatus("success");
          toast.success("Email verified successfully!");
          
          // Redirect after short delay
          setTimeout(() => {
            navigate("/projects");
          }, 2000);
        }
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred");
      toast.error("Verification failed");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSettingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error("Failed to set password", { description: error.message });
      } else {
        setStatus("success");
        toast.success("Password set successfully! Welcome to SpecMaster!");
        
        // Redirect after short delay
        setTimeout(() => {
          navigate("/projects");
        }, 2000);
      }
    } catch (err: any) {
      toast.error("An error occurred", { description: err.message });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const passwordValid = password.length >= 6;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <span className="text-3xl font-bold text-brand-gradient">specmaster</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            {status === "pending" && (
              <>
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>
                  {isInvite ? "Accept Invitation" : "Confirm Your Email"}
                </CardTitle>
                <CardDescription>
                  {isInvite 
                    ? "Click the button below to accept your invitation and join SpecMaster."
                    : "Click the button below to verify your email address and complete your registration."
                  }
                </CardDescription>
              </>
            )}
            
            {status === "loading" && (
              <>
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <CardTitle>Verifying...</CardTitle>
                <CardDescription>
                  Please wait while we verify your email address.
                </CardDescription>
              </>
            )}

            {status === "set-password" && (
              <>
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Set Your Password</CardTitle>
                <CardDescription>
                  Create a password to complete your account setup.
                </CardDescription>
              </>
            )}
            
            {status === "success" && (
              <>
                <div className="mx-auto mb-4 p-4 rounded-full bg-emerald-500/10 w-fit">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle className="text-emerald-500">Welcome to SpecMaster!</CardTitle>
                <CardDescription>
                  Your account is ready. Redirecting you to the app...
                </CardDescription>
              </>
            )}
            
            {status === "error" && (
              <>
                <div className="mx-auto mb-4 p-4 rounded-full bg-destructive/10 w-fit">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-destructive">Verification Failed</CardTitle>
                <CardDescription>
                  {errorMessage}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {status === "pending" && (
              <Button onClick={handleConfirmEmail} className="w-full" size="lg">
                {isInvite ? "Accept Invitation" : "Confirm Email"}
              </Button>
            )}

            {status === "set-password" && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {password && !passwordValid && (
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSettingPassword || !passwordValid || !passwordsMatch}
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Password...
                    </>
                  ) : (
                    "Set Password & Continue"
                  )}
                </Button>
              </form>
            )}
            
            {status === "error" && (
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/auth")} 
                  variant="outline" 
                  className="w-full"
                >
                  Back to Sign In
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  If your link expired, please contact the administrator to request a new invitation.
                </p>
              </div>
            )}
            
            {status === "success" && (
              <Button 
                onClick={() => navigate("/projects")} 
                className="w-full"
              >
                Go to Projects
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
