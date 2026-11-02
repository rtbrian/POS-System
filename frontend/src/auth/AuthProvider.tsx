import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getSupabaseClient } from '../supabase';
import { AuthContext, type AuthContextValue } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => {};

    void Promise.resolve().then(() => {
      if (!active) return;
      const client = getSupabaseClient();
      const { data } = client.auth.onAuthStateChange((_event, currentSession) => {
        if (active) setSession(currentSession);
      });
      unsubscribe = () => data.subscription.unsubscribe();
      return client.auth.getSession();
    }).then((result) => {
      if (!active || !result) return;
      if (result.error) setError(result.error.message);
      setSession(result.data.session);
      setLoading(false);
    }).catch((clientError: unknown) => {
      if (!active) return;
      setError(clientError instanceof Error ? clientError.message : 'Supabase is not configured');
      setLoading(false);
    });

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
