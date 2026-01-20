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

    let query = supabase
      .from('access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (!isAdmin) {
      const { data: authorBooks, error: booksError } = await supabase
        .from('books')
        .select('id')
        .eq('author_id', user.id);

      if (booksError) {
        console.error('Error fetching author books:', booksError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch author books' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!authorBooks || authorBooks.length === 0) {
        return new Response(
          JSON.stringify({ count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const bookIds = authorBooks.map(book => book.id);
      query = query.in('book_id', bookIds);
    }

    const { count, error: countError } = await query;

    if (countError) {
      console.error('Error counting access requests:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to count access requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ count: count || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get pending request count error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
