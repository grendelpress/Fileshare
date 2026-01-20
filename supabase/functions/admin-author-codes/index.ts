import { createClient } from 'npm:@supabase/supabase-js@2';

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
  if (!author.is_super_admin) return null;

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
    if (!authContext || !authContext.isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Super admin access required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const { data: codes, error } = await supabase
        .from('author_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching author codes:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch author codes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const codesWithUsage = await Promise.all(
        (codes || []).map(async (code) => {
          const { count } = await supabase
            .from('authors')
            .select('*', { count: 'exact', head: true })
            .eq('used_author_code', code.code);

          return {
            ...code,
            usage_count: count || 0,
          };
        })
      );

      return new Response(
        JSON.stringify({ codes: codesWithUsage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { code, description } = await req.json();

      if (!code || !code.trim()) {
        return new Response(
          JSON.stringify({ error: 'Code is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newCode, error } = await supabase
        .from('author_codes')
        .insert({
          code: code.trim(),
          description: description?.trim() || '',
          is_active: true,
          created_by: authContext.authorId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating author code:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create author code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ code: newCode }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { id, isActive } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing code id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = {};
      if (isActive !== undefined) updates.is_active = isActive;

      const { data: updatedCode, error } = await supabase
        .from('author_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating author code:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update author code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ code: updatedCode }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing code id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('author_codes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting author code:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete author code' }),
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
    console.error('Admin author codes error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
