import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import bcrypt from 'npm:bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookSlug, firstName, lastName, email, referredBy, password, mailingOptIn, format } = await req.json();

    if (!bookSlug || !firstName || !lastName || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('slug', bookSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: 'Book not found or no longer active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    let matchedPassword = null;
    let isTemporaryPassword = false;
    let accessRequestId: string | null = null;

    const { data: accessRequests, error: accessRequestError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('book_id', book.id)
      .eq('email', normalizedEmail)
      .eq('status', 'approved')
      .not('temporary_password_hash', 'is', null)
      .is('claimed_at', null);

    if (!accessRequestError && accessRequests && accessRequests.length > 0) {
      for (const request of accessRequests) {
        const now = new Date();
        const expiresAt = request.password_expires_at ? new Date(request.password_expires_at) : null;

        if (expiresAt && expiresAt > now) {
          const isValid = await bcrypt.compare(password, request.temporary_password_hash);
          if (isValid) {
            isTemporaryPassword = true;
            accessRequestId = request.id;
            matchedPassword = {
              label: 'Temporary Access',
              id: request.id,
            };
            break;
          }
        }
      }
    }

    if (!matchedPassword) {
      const distributionTypeMap: { [key: string]: string } = {
        'HWA': 'hwa',
        'ARC': 'arc',
        'Giveaway': 'giveaway',
        'Other': 'other',
      };

      const distributionType = distributionTypeMap[referredBy] || 'other';

      const { data: passwords, error: pwError } = await supabase
        .from('book_passwords')
        .select('*')
        .eq('book_id', book.id)
        .eq('distribution_type', distributionType)
        .eq('is_active', true);

      if (pwError || !passwords || passwords.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid password for selected distribution type' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      for (const pw of passwords) {
        const isValid = await bcrypt.compare(password, pw.password_hash);
        if (isValid) {
          matchedPassword = pw;
          break;
        }
      }

      if (!matchedPassword) {
        return new Response(
          JSON.stringify({ error: 'Invalid password for selected distribution type' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: signup, error: signupError } = await supabase
      .from('signups')
      .upsert(
        {
          book_id: book.id,
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          referred_by: referredBy || '',
          mailing_opt_in: mailingOptIn || false,
          source_password_label: matchedPassword.label,
        },
        {
          onConflict: 'book_id,email',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (signupError) {
      console.error('Signup error:', signupError);
      return new Response(
        JSON.stringify({ error: 'Failed to create signup' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isTemporaryPassword && accessRequestId) {
      await supabase
        .from('access_requests')
        .update({ claimed_at: new Date().toISOString() })
        .eq('id', accessRequestId);
    }

    const requestedFormat = format || 'pdf';
    if (requestedFormat === 'epub' && !book.epub_storage_key) {
      return new Response(
        JSON.stringify({ error: 'EPUB format not available for this book' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenPayload = {
      signup_id: signup.id,
      book_id: book.id,
      format: requestedFormat,
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    };

    const token = btoa(JSON.stringify(tokenPayload));
    const downloadUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/download?token=${token}`;

    return new Response(
      JSON.stringify({ success: true, downloadUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});