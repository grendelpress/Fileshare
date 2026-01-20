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
      let query = supabase
        .from('series')
        .select('*, books:books(count)')
        .order('display_order', { ascending: true });

      if (!authContext.isSuperAdmin) {
        query = query.eq('author_id', authContext.authorId);
      }

      const { data: series, error } = await query;

      if (error) {
        console.error('Error fetching series:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch series' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const seriesWithCounts = await Promise.all(
        (series || []).map(async (s) => {
          const { count } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('series_id', s.id);

          return { ...s, book_count: count || 0 };
        })
      );

      return new Response(
        JSON.stringify({ series: seriesWithCounts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { name, authorName, slug, description, coverImageKey, displayOrder, isActive } = await req.json();

      if (!name || !authorName || !slug) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: series, error } = await supabase
        .from('series')
        .insert({
          name,
          author_name: authorName,
          slug,
          description: description || '',
          cover_image_key: coverImageKey || null,
          display_order: displayOrder !== undefined ? displayOrder : 0,
          is_active: isActive !== undefined ? isActive : true,
          author_id: authContext.authorId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating series:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create series' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ series }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { id, name, authorName, slug, description, coverImageKey, displayOrder, isActive } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing series id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase.from('series').select('id').eq('id', id);
      if (!authContext.isSuperAdmin) {
        query = query.eq('author_id', authContext.authorId);
      }
      const { data: existingSeries } = await query.single();

      if (!existingSeries) {
        return new Response(
          JSON.stringify({ error: 'Series not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (authorName !== undefined) updates.author_name = authorName;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (coverImageKey !== undefined) updates.cover_image_key = coverImageKey;
      if (displayOrder !== undefined) updates.display_order = displayOrder;
      if (isActive !== undefined) updates.is_active = isActive;

      const { data: series, error } = await supabase
        .from('series')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating series:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update series' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ series }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing series id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!authContext.isSuperAdmin) {
        const { data: series } = await supabase
          .from('series')
          .select('author_id')
          .eq('id', id)
          .single();

        if (!series || series.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Series not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { error } = await supabase
        .from('series')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting series:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete series' }),
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
    console.error('Admin series error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});