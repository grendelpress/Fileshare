import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}`;
  }
  return str;
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

    const url = new URL(req.url);
    const bookSlug = url.searchParams.get('book');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const optinOnly = url.searchParams.get('optinOnly') === 'true';
    const format = url.searchParams.get('format') || 'csv';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase
      .from('signups')
      .select('*, books!inner(slug, title, author_id)');

    // Filter by author unless super admin
    if (!authContext.isSuperAdmin) {
      query = query.eq('books.author_id', authContext.authorId);
    }

    if (bookSlug) {
      query = query.eq('books.slug', bookSlug);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('created_at', toDate.toISOString().split('T')[0]);
    }

    if (optinOnly) {
      query = query.eq('mailing_opt_in', true);
    }

    const { data: signups, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signups:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch signups' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (format === 'json') {
      const formattedSignups = (signups || []).map((signup) => ({
        id: signup.id,
        first_name: signup.first_name,
        last_name: signup.last_name,
        email: signup.email,
        referred_by: signup.referred_by,
        optin_mailing: signup.mailing_opt_in,
        created_at: signup.created_at,
        book_title: (signup as any).books?.title || '',
        password_label: signup.source_password_label,
      }));

      return new Response(
        JSON.stringify({ signups: formattedSignups }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const csvHeaders = [
      'first_name',
      'last_name',
      'email',
      'referred_by',
      'mailing_opt_in',
      'created_at',
      'source_password_label',
      'book_title',
    ];

    let csv = csvHeaders.join(',') + '\n';

    for (const signup of signups || []) {
      const row = [
        escapeCsvValue(signup.first_name),
        escapeCsvValue(signup.last_name),
        escapeCsvValue(signup.email),
        escapeCsvValue(signup.referred_by),
        escapeCsvValue(signup.mailing_opt_in),
        escapeCsvValue(new Date(signup.created_at).toISOString()),
        escapeCsvValue(signup.source_password_label),
        escapeCsvValue((signup as any).books?.title || ''),
      ];
      csv += row.join(',') + '\n';
    }

    const filename = `signups-${bookSlug || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Admin exports error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});