"use client";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';

const KamAuthContext = createContext(null);

export function KamAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('Kam could not restore the Supabase session.', error);
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    loading,
    configured: supabaseConfigured,
    supabase,
    async requestPhoneOtp(phone) {
      if (!supabase) return { error: new Error('Supabase is not configured.') };
      return supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
    },
    async verifyPhoneOtp(phone, token) {
      if (!supabase) return { error: new Error('Supabase is not configured.') };
      return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    },
    async signInWithGoogle() {
      if (!supabase) return { error: new Error('Supabase is not configured.') };
      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
    },
    async signOut() {
      if (!supabase) return { error: new Error('Supabase is not configured.') };
      return supabase.auth.signOut();
    },
  }), [session, loading]);

  return <KamAuthContext.Provider value={value}>{children}</KamAuthContext.Provider>;
}

export function useKamAuth() {
  const context = useContext(KamAuthContext);
  if (!context) throw new Error('useKamAuth must be used inside KamAuthProvider');
  return context;
}

