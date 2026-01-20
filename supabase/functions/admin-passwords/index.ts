import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AuthContext {
  authorId: string;
  isSuperAdmin: boolean;
}

async function verifyAuth(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');

  // Use service role key to bypass RLS when checking auth
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('is_super_admin, is_approved, account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (!author || !author.is_approved) return null;
  if (!author.is_super_admin && author.account_status !== 'active' && author.account_status !== 'trial') {
    return null;
  }

  return {
    authorId: user.id,
    isSuperAdmin: author.is_super_admin || false,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authContext = await verifyAuth(req);
    if (!authContext) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const bookId = url.searchParams.get('bookId');

      if (!bookId) {
        return new Response(
          JSON.stringify({ error: 'Missing bookId parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify author owns the book
      if (!authContext.isSuperAdmin) {
        const { data: book } = await supabase
          .from('books')
          .select('author_id')
          .eq('id', bookId)
          .single();

        if (!book || book.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { data: passwords, error } = await supabase
        .from('book_passwords')
        .select('*')
        .eq('book_id', bookId)
        .order('distribution_type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching passwords:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch passwords' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ passwords }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const requestBody = await req.json();
      const { bookId, label, password, distributionType, isActive } = requestBody;

      if (!bookId || !label || !password || !distributionType) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['arc', 'hwa', 'giveaway', 'other'].includes(distributionType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid distribution type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify author owns the book
      if (!authContext.isSuperAdmin) {
        const { data: book } = await supabase
          .from('books')
          .select('author_id')
          .eq('id', bookId)
          .single();

        if (!book || book.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const { data: bookPassword, error } = await supabase
        .from('book_passwords')
        .insert({
          book_id: bookId,
          label,
          password_hash: passwordHash,
          distribution_type: distributionType,
          is_active: isActive !== undefined ? isActive : true,
          author_id: authContext.authorId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating password:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ password: bookPassword }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { id, label, password, distributionType, isActive } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing password id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (distributionType !== undefined && !['arc', 'hwa', 'giveaway', 'other'].includes(distributionType)) {
        return new Response(
          JSON.stringify({ error: 'Invalid distribution type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify author owns the password's book
      if (!authContext.isSuperAdmin) {
        const { data: bookPassword } = await supabase
          .from('book_passwords')
          .select('book_id, books!inner(author_id)')
          .eq('id', id)
          .single();

        if (!bookPassword || (bookPassword as any).books.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const updates: any = {};
      if (label !== undefined) updates.label = label;
      if (distributionType !== undefined) updates.distribution_type = distributionType;
      if (isActive !== undefined) updates.is_active = isActive;
      if (password !== undefined) {
        updates.password_hash = await bcrypt.hash(password, 10);
      }

      const { data: bookPassword, error } = await supabase
        .from('book_passwords')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating password:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ password: bookPassword }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing password id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify author owns the password's book
      if (!authContext.isSuperAdmin) {
        const { data: bookPassword } = await supabase
          .from('book_passwords')
          .select('book_id, books!inner(author_id)')
          .eq('id', id)
          .single();

        if (!bookPassword || (bookPassword as any).books.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { error } = await supabase
        .from('book_passwords')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting password:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin passwords error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});