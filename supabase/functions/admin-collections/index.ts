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
      const url = new URL(req.url);
      const collectionId = url.searchParams.get('id');

      if (collectionId) {
        let query = supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId);

        if (!authContext.isSuperAdmin) {
          query = query.eq('author_id', authContext.authorId);
        }

        const { data: collection, error: collectionError } = await query.single();

        if (collectionError) {
          console.error('Error fetching collection:', collectionError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch collection' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: collectionBooks, error: booksError } = await supabase
          .from('collection_books')
          .select('book_id, order_in_collection')
          .eq('collection_id', collectionId)
          .order('order_in_collection', { ascending: true });

        if (booksError) {
          console.error('Error fetching collection books:', booksError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch collection books' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            collection,
            books: collectionBooks || []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase
        .from('collections')
        .select('*')
        .order('display_order', { ascending: true });

      if (!authContext.isSuperAdmin) {
        query = query.eq('author_id', authContext.authorId);
      }

      const { data: collections, error } = await query;

      if (error) {
        console.error('Error fetching collections:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch collections' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const collectionsWithCounts = await Promise.all(
        (collections || []).map(async (c) => {
          const { count } = await supabase
            .from('collection_books')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', c.id);

          return { ...c, book_count: count || 0 };
        })
      );

      return new Response(
        JSON.stringify({ collections: collectionsWithCounts }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { name, slug, description, coverImageKey, displayOrder, isActive, books } = await req.json();

      if (!name || !slug) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: collection, error } = await supabase
        .from('collections')
        .insert({
          name,
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
        console.error('Error creating collection:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to create collection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (books && Array.isArray(books) && books.length > 0) {
        const bookRecords = books.map((book: { book_id: string; order_in_collection: number }) => ({
          collection_id: collection.id,
          book_id: book.book_id,
          order_in_collection: book.order_in_collection || 0,
        }));

        const { error: booksError } = await supabase
          .from('collection_books')
          .insert(bookRecords);

        if (booksError) {
          console.error('Error adding books to collection:', booksError);
        }
      }

      return new Response(
        JSON.stringify({ collection }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { id, name, slug, description, coverImageKey, displayOrder, isActive, books } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing collection id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase.from('collections').select('id').eq('id', id);
      if (!authContext.isSuperAdmin) {
        query = query.eq('author_id', authContext.authorId);
      }
      const { data: existingCollection } = await query.single();

      if (!existingCollection) {
        return new Response(
          JSON.stringify({ error: 'Collection not found or unauthorized' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (slug !== undefined) updates.slug = slug;
      if (description !== undefined) updates.description = description;
      if (coverImageKey !== undefined) updates.cover_image_key = coverImageKey;
      if (displayOrder !== undefined) updates.display_order = displayOrder;
      if (isActive !== undefined) updates.is_active = isActive;

      const { data: collection, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating collection:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update collection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (books !== undefined && Array.isArray(books)) {
        await supabase
          .from('collection_books')
          .delete()
          .eq('collection_id', id);

        if (books.length > 0) {
          const bookRecords = books.map((book: { book_id: string; order_in_collection: number }) => ({
            collection_id: id,
            book_id: book.book_id,
            order_in_collection: book.order_in_collection || 0,
          }));

          const { error: booksError } = await supabase
            .from('collection_books')
            .insert(bookRecords);

          if (booksError) {
            console.error('Error updating collection books:', booksError);
          }
        }
      }

      return new Response(
        JSON.stringify({ collection }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Missing collection id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!authContext.isSuperAdmin) {
        const { data: collection } = await supabase
          .from('collections')
          .select('author_id')
          .eq('id', id)
          .single();

        if (!collection || collection.author_id !== authContext.authorId) {
          return new Response(
            JSON.stringify({ error: 'Collection not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting collection:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete collection' }),
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
    console.error('Admin collections error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});