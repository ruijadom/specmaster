import { User, Session } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: null }>;
  resetPassword: (newPassword: string) => Promise<{ error: null }>;
}

export type UseAuthReturn = AuthState & AuthActions;
