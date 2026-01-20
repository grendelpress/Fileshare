import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { customAlphabet } from 'npm:nanoid@5.1.6';
import { Resend } from 'npm:resend@6.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ApprovalEmailData {
  readerEmail: string;
  readerName: string;
  bookTitle: string;
  temporaryPassword: string;
  expirationDate: string;
  bookUrl: string;
}

const createHtmlEmail = (data: ApprovalEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 3px solid #1a1a1a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">Grendel Press</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Book Distribution Platform</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  ✓ Access Approved
                </div>
              </div>

              <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Welcome to "${data.bookTitle}"</h2>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333;">
                Hello ${data.readerName},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.5; color: #333;">
                Great news! Your access request has been approved. You can now download and read <strong>${data.bookTitle}</strong>.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">Your Temporary Password:</p>
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a; font-family: 'Courier New', monospace; letter-spacing: 2px;">${data.temporaryPassword}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f8f8; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">How to Access Your Book:</p>
                    <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #333;">
                      <li style="margin-bottom: 8px;">Click the button below to go to the book page</li>
                      <li style="margin-bottom: 8px;">Enter the temporary password shown above</li>
                      <li style="margin-bottom: 8px;">Download your book in your preferred format</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <a href="${data.bookUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Access Your Book</a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #991b1b;">
                  <strong>Important:</strong> This temporary password will expire on <strong>${new Date(data.expirationDate).toLocaleDateString('en-US', { dateStyle: 'full' })}</strong>. Please download your book before this date.
                </p>
              </div>

              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #666; text-align: center;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: #0066cc; text-align: center; word-break: break-all;">
                ${data.bookUrl}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 40px; background-color: #f8f8f8; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #666; text-align: center;">
                Enjoy your reading! If you have any questions, feel free to reach out.
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #666; text-align: center;">
                Happy reading!
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

const createTextEmail = (data: ApprovalEmailData) => `
Access Approved - Grendel Press

Hello ${data.readerName},

Great news! Your access request has been approved. You can now download and read "${data.bookTitle}".

YOUR TEMPORARY PASSWORD:
${data.temporaryPassword}

HOW TO ACCESS YOUR BOOK:
-------------------------
1. Go to: ${data.bookUrl}
2. Enter the temporary password shown above
3. Download your book in your preferred format

IMPORTANT: This temporary password will expire on ${new Date(data.expirationDate).toLocaleDateString('en-US', { dateStyle: 'full' })}. Please download your book before this date.

Enjoy your reading! If you have any questions, feel free to reach out.

Happy reading!

---
© ${new Date().getFullYear()} Grendel Press. All rights reserved.
`;

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

    const { requestId, action, denialReason } = await req.json();

    if (!requestId || !action || !['approve', 'deny'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: accessRequest, error: requestError } = await supabase
      .from('access_requests')
      .select('*, books!inner(id, title, slug, author_id)')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError || !accessRequest) {
      return new Response(
        JSON.stringify({ error: 'Access request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = author.is_super_admin || author.role === 'admin';
    const isBookAuthor = accessRequest.books.author_id === user.id;

    if (!isAdmin && !isBookAuthor) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to manage this request' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (accessRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Request has already been ${accessRequest.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updateData: any = {
      status: action === 'approve' ? 'approved' : 'denied',
      approved_by: user.id,
      updated_at: new Date().toISOString(),
    };

    let temporaryPassword: string | null = null;

    if (action === 'approve') {
      const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);
      temporaryPassword = nanoid();
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      updateData.temporary_password_hash = passwordHash;
      updateData.password_expires_at = expiresAt.toISOString();
    } else if (action === 'deny' && denialReason) {
      updateData.denial_reason = denialReason;
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('access_requests')
      .update(updateData)
      .eq('id', requestId)
      .select('*, books!inner(id, title, author_name)')
      .single();

    if (updateError) {
      console.error('Error updating access request:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update access request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve' && temporaryPassword) {
      try {
        const bookSlug = accessRequest.books.slug;
        const appUrl = (Deno.env.get('APP_URL') || 'https://files.grendelpress.com').replace(/\/$/, '');
        const bookUrl = `${appUrl}/books/${bookSlug}`;

        const emailData: ApprovalEmailData = {
          readerEmail: accessRequest.email,
          readerName: `${accessRequest.first_name} ${accessRequest.last_name}`,
          bookTitle: accessRequest.books.title,
          temporaryPassword,
          expirationDate: updateData.password_expires_at,
          bookUrl,
        };

        const { error: emailError } = await resend.emails.send({
          from: 'Grendel Press <grendel@grendelpress.com>',
          to: accessRequest.email,
          subject: `Access Approved: "${accessRequest.books.title}"`,
          html: createHtmlEmail(emailData),
          text: createTextEmail(emailData),
        });

        if (emailError) {
          console.error('Failed to send approval email notification:', emailError);
        }
      } catch (emailError) {
        console.error('Error sending approval email notification (non-blocking):', emailError);
      }
    }

    const response: any = {
      success: true,
      message: action === 'approve'
        ? 'Access request approved successfully'
        : 'Access request denied',
      request: updatedRequest,
    };

    if (temporaryPassword) {
      response.temporaryPassword = temporaryPassword;
      response.expiresAt = updateData.password_expires_at;
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Manage access request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});