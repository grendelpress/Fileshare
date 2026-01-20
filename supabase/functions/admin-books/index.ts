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
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (!authContext.isSuperAdmin) {
        query = query.eq('author_id', authContext.authorId);
      }

      const { data: books, error } = await query;

      if (error) {
        console.error('Error fetching books:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch books' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ books }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { title, authorName, slug, description, storageKey, epubStorageKey, coverImageKey, isActive, seriesId, orderInSeries } = await req.json();

      if (!title || !authorName || !slug || !storageKey) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: book, error } = await supabase
        .from('books')
        .insert({
          title,
          author_name: authorName,
          slug,
          description: description || '',
          storage_key: storageKey,
          epub_storage_key: epubStorageKey || null,
          cover_image_key: coverImageKey || null,
          is_active: isActive !== undefined ? isActive : true,
          series_id: seriesId || null,
          order_in_series: orderInSeries || null,
          author_id: authContext.authorId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating book:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create book' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ book }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { id, title, authorName, slug, description, storageKey, epubStorageKey, coverImageKey, isActive, seriesId, orderInSeries } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing book id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase.from('books').select('id').eq('id', id);
      if (!authContext.isSuperAdmin) {
        query = query.eq('author_id', authContext.authorId);
      }
      const { data: existingBook } = await query.single();

      if (!existingBook) {
        return new Response(
          JSON.stringify({ error: 'Book not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (authorName !== undefined) updates.author_name = authorName;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (storageKey !== undefined) updates.storage_key = storageKey;
      if (epubStorageKey !== undefined) updates.epub_storage_key = epubStorageKey;
      if (coverImageKey !== undefined) updates.cover_image_key = coverImageKey;
      if (isActive !== undefined) updates.is_active = isActive;
      if (seriesId !== undefined) updates.series_id = seriesId;
      if (orderInSeries !== undefined) updates.order_in_series = orderInSeries;

      const { data: book, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating book:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update book' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ book }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing book id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase.from('books').delete().eq('id', id);
      if (!authContext.isSuperAdmin) {
        const { data: book } = await supabase
          .from('books')
          .select('author_id')
          .eq('id', id)
          .single();

        if (!book || book.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Book not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting book:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete book' }),
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
    console.error('Admin books error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});