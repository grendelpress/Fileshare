import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@6.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface EmailData {
  authorEmail: string;
  authorName: string;
  requesterName: string;
  requesterEmail: string;
  bookTitle: string;
  requestId: string;
  timestamp: string;
  dashboardUrl: string;
}

const createHtmlEmail = (data: EmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Access Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 3px solid #1a1a1a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">Grendel Press</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Author Portal</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">New Access Request</h2>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333;">
                Hello ${data.authorName},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333;">
                You have received a new access request for your book <strong>${data.bookTitle}</strong>.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f8f8; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Requester Name:</p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">${data.requesterName}</p>

                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Email:</p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">${data.requesterEmail}</p>

                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Request Time:</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">${new Date(data.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 16px;">
                    <a href="${data.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">View Request in Dashboard</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.5; color: #666; text-align: center;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #0066cc; text-align: center; word-break: break-all;">
                ${data.dashboardUrl}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f8f8f8; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #666; text-align: center;">
                You can approve or deny this request from your admin dashboard.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #999;">
                © ${new Date().getFullYear()} Grendel Press. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const createTextEmail = (data: EmailData) => `
New Access Request - Grendel Press

Hello ${data.authorName},

You have received a new access request for your book "${data.bookTitle}".

REQUEST DETAILS:
----------------
Requester Name: ${data.requesterName}
Email: ${data.requesterEmail}
Request Time: ${new Date(data.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}

To review and respond to this request, visit your admin dashboard:
${data.dashboardUrl}

You can approve or deny this request from your admin dashboard.

---
© ${new Date().getFullYear()} Grendel Press. All rights reserved.
`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { bookSlug, firstName, lastName, email } = await req.json();

    if (!bookSlug || !firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        slug,
        is_active,
        author_id,
        authors:author_id (
          id,
          display_name,
          email
        )
      `)
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

    const { data: existingRequest, error: checkError } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('book_id', book.id)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing request:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return new Response(
          JSON.stringify({ 
            error: 'You have already submitted an access request for this book. Please wait for approval.',
            requestExists: true,
            status: 'pending'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (existingRequest.status === 'approved') {
        return new Response(
          JSON.stringify({ 
            error: 'Your access request has already been approved. Check your email for access details.',
            requestExists: true,
            status: 'approved'
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: newRequest, error: insertError } = await supabase
      .from('access_requests')
      .insert({
        book_id: book.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: normalizedEmail,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating access request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit access request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const authorEmail = (book as any).authors?.email;
      const authorName = (book as any).authors?.display_name || 'Author';

      if (authorEmail) {
        const appUrl = (Deno.env.get('APP_URL') || 'https://files.grendelpress.com').replace(/\/$/, '');
        const dashboardUrl = `${appUrl}/admin`;

        const emailData: EmailData = {
          authorEmail,
          authorName,
          requesterName: `${firstName.trim()} ${lastName.trim()}`,
          requesterEmail: normalizedEmail,
          bookTitle: book.title,
          requestId: newRequest.id,
          timestamp: newRequest.created_at || new Date().toISOString(),
          dashboardUrl,
        };

        const { error: emailError } = await resend.emails.send({
          from: 'Grendel Press <grendel@grendelpress.com>',
          to: authorEmail,
          subject: `New Access Request for "${book.title}"`,
          html: createHtmlEmail(emailData),
          text: createTextEmail(emailData),
        });

        if (emailError) {
          console.error('Failed to send email notification:', emailError);
        } else {
          console.log('Email notification sent successfully!');
        }
      } else {
        console.warn('No author email found, skipping email notification');
      }
    } catch (emailError) {
      console.error('Error sending email notification (non-blocking):', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Access request submitted successfully. You will be notified by email if your request is approved.',
        requestId: newRequest.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Request access error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});