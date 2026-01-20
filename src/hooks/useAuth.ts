import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthorProfile {
  id: string;
  display_name: string;
  email: string;
  role: 'user' | 'author' | 'admin';
  is_grendel_press: boolean;
  is_super_admin: boolean;
  subscription_status: string;
  account_status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trial_start_date: string | null;
  trial_end_date: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('id, display_name, email, role, is_grendel_press, is_super_admin, subscription_status, account_status, trial_start_date, trial_end_date')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as AuthorProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const getTrialDaysRemaining = (): number | null => {
    if (!profile?.trial_end_date) return null;

    const endDate = new Date(profile.trial_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthor: profile?.role === 'author' || profile?.role === 'admin',
    isAdmin: profile?.role === 'admin',
    isSuperAdmin: profile?.is_super_admin ?? false,
    accountStatus: profile?.account_status ?? 'active',
    isOnTrial: profile?.account_status === 'trial',
    isSuspended: profile?.account_status === 'suspended',
    trialDaysRemaining: getTrialDaysRemaining(),
  };
}