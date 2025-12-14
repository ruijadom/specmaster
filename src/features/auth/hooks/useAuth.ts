import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authRequests } from "../requests";
import type { UseAuthReturn } from "../types";

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = authRequests.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    authRequests.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authRequests.signIn(email, password);
      toast.success("Successfully signed in!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      await authRequests.signUp(email, password, redirectUrl);
      toast.success("Account created! You can now sign in.");
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authRequests.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      await authRequests.forgotPassword(email, redirectUrl);
      toast.success("Password reset email sent! Check your inbox.");
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
      throw error;
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      await authRequests.resetPassword(newPassword);
      toast.success("Password updated successfully!");
      navigate("/");
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
  };
};
