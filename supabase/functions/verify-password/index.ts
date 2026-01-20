import { createClient } from 'npm:@supabase/supabase-js@2';
import bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { bookSlug, password, referredBy } = await req.json();

    console.log('Verifying password for book:', bookSlug);

    if (!bookSlug || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('slug', bookSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (bookError || !book) {
      console.error('Book not found:', bookError);
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Book found:', book.id);

    // First check for temporary passwords from access requests
    const { data: accessRequests, error: arError } = await supabase
      .from('access_requests')
      .select('id, temporary_password_hash, password_expires_at')
      .eq('book_id', book.id)
      .eq('status', 'approved')
      .not('temporary_password_hash', 'is', null);

    console.log('Access requests found:', accessRequests?.length, 'Error:', arError);

    if (accessRequests && accessRequests.length > 0) {
      for (const request of accessRequests) {
        const now = new Date();
        const expiresAt = request.password_expires_at ? new Date(request.password_expires_at) : null;

        console.log('Checking request:', request.id, 'Expires:', expiresAt, 'Now:', now);

        if (expiresAt && expiresAt > now) {
          console.log('Checking password against hash...');
          const isValid = await bcrypt.compare(password, request.temporary_password_hash);
          console.log('Password valid:', isValid);
          if (isValid) {
            return new Response(
              JSON.stringify({ valid: true, type: 'temporary' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Check distribution passwords
    const distributionTypeMap: { [key: string]: string } = {
      'HWA': 'hwa',
      'ARC': 'arc',
      'Giveaway': 'giveaway',
      'Other': 'other',
    };

    const distributionType = distributionTypeMap[referredBy] || 'other';

    const { data: passwords } = await supabase
      .from('book_passwords')
      .select('password_hash')
      .eq('book_id', book.id)
      .eq('distribution_type', distributionType)
      .eq('is_active', true);

    if (passwords) {
      for (const pw of passwords) {
        const isValid = await bcrypt.compare(password, pw.password_hash);
        if (isValid) {
          return new Response(
            JSON.stringify({ valid: true, type: 'distribution' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ valid: false, error: 'Invalid access password' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error verifying password:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
