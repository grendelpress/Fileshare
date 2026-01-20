import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: author, error: authorError } = await supabase
      .from('authors')
      .select('id, is_super_admin, role')
      .eq('id', user.id)
      .maybeSingle();

    if (authorError || !author) {
      return new Response(
        JSON.stringify({ error: 'User not found or not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = author.is_super_admin || author.role === 'admin';

    const url = new URL(req.url);
    const bookSlug = url.searchParams.get('book');
    const status = url.searchParams.get('status');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let query = supabase
      .from('access_requests')
      .select('*, books!inner(id, title, author_name, author_id)');

    if (!isAdmin) {
      query = query.eq('books.author_id', user.id);
    }

    if (bookSlug) {
      query = query.eq('books.slug', bookSlug);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (from) {
      query = query.gte('created_at', `${from}T00:00:00Z`);
    }

    if (to) {
      query = query.lte('created_at', `${to}T23:59:59Z`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Error fetching access requests:', requestsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch access requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ requests: requests || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin access requests error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});