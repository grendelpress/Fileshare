import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useAccessRequestCount() {
  const { user, profile } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    fetchCount();

    const channel = supabase
      .channel('access_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_requests',
        },
        async () => {
          await fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  async function fetchCount() {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      const isAdmin = profile?.is_super_admin || profile?.role === 'admin';

      let query = supabase
        .from('access_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!isAdmin) {
        const { data: authorBooks } = await supabase
          .from('books')
          .select('id')
          .eq('author_id', user.id);

        if (!authorBooks || authorBooks.length === 0) {
          setCount(0);
          setLoading(false);
          return;
        }

        const bookIds = authorBooks.map(book => book.id);
        query = query.in('book_id', bookIds);
      }

      const { count: pendingCount, error } = await query;

      if (error) {
        console.error('Error fetching access request count:', error);
        setCount(0);
      } else {
        setCount(pendingCount || 0);
      }
    } catch (error) {
      console.error('Error in fetchCount:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  return { count, loading, refetch: fetchCount };
}
