import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => undefined;

    try {
      const client = getSupabaseClient();
      const { data } = client.auth.onAuthStateChange((_event, currentSession) => {
        if (active) setSession(currentSession);
      });
      unsubscribe = () => data.subscription.unsubscribe();

      void client.auth.getSession().then(({ data: sessionData, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(sessionError.message);
        setSession(sessionData.session);
        setLoading(false);
      }).catch((sessionError: unknown) => {
        if (!active) return;
        setError(sessionError instanceof Error ? sessionError.message : 'Unable to load session');
        setLoading(false);
      });
    } catch (clientError) {
      setError(clientError instanceof Error ? clientError.message : 'Supabase is not configured');
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
