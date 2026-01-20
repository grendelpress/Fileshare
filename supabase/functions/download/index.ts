import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { nanoid } from 'npm:nanoid@5.0.4';
import JSZip from 'npm:jszip@3.10.1';

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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let tokenPayload: any;
    try {
      tokenPayload = JSON.parse(atob(token));
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tokenPayload.exp && tokenPayload.exp < Math.floor(Date.now() / 1000)) {
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: signup, error: signupError } = await supabase
      .from('signups')
      .select('*')
      .eq('id', tokenPayload.signup_id)
      .maybeSingle();

    if (signupError || !signup) {
      return new Response(
        JSON.stringify({ error: 'Invalid signup' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', tokenPayload.book_id)
      .maybeSingle();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: 'Invalid book' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const format = tokenPayload.format || 'pdf';
    const watermarkUid = nanoid(8);
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    if (format === 'epub') {
      const storageKey = book.epub_storage_key;
      if (!storageKey) {
        return new Response(
          JSON.stringify({ error: 'EPUB not available for this book' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: masterData, error: storageError } = await supabase.storage
        .from('master_pdfs')
        .download(storageKey);

      if (storageError || !masterData) {
        console.error('Storage error:', storageError);
        return new Response(
          JSON.stringify({ error: 'Master EPUB not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const epubBuffer = await masterData.arrayBuffer();
      const zip = await JSZip.loadAsync(epubBuffer);

      const watermarkText = `${signup.email} \u2022 ${book.title} \u2022 ${watermarkUid}`;

      try {
        const containerFile = zip.file('META-INF/container.xml');
        if (!containerFile) {
          throw new Error('Invalid EPUB: container.xml not found');
        }

        const containerXml = await containerFile.async('text');
        const containerMatch = containerXml.match(/full-path="([^"]+)"/);
        if (!containerMatch) {
          throw new Error('Invalid EPUB: could not find content.opf path');
        }

        const contentOpfPath = containerMatch[1];
        const contentDir = contentOpfPath.substring(0, contentOpfPath.lastIndexOf('/') + 1);

        const contentOpfFile = zip.file(contentOpfPath);
        if (!contentOpfFile) {
          throw new Error('Invalid EPUB: content.opf not found');
        }

        let contentOpfXml = await contentOpfFile.async('text');

        const watermarkId = 'watermark-page';
        const watermarkFilename = 'watermark.xhtml';
        const watermarkPath = contentDir + watermarkFilename;

        const watermarkXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Licensed Copy</title>
  <style>
    body {
      font-family: serif;
      text-align: center;
      padding: 2em;
      margin: 0;
    }
    .watermark-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    h1 {
      font-size: 1.5em;
      margin-bottom: 2em;
      color: #333;
    }
    .watermark-text {
      font-size: 1em;
      color: #666;
      line-height: 1.8;
      margin: 0.5em 0;
    }
  </style>
</head>
<body>
  <div class="watermark-container">
    <h1>Licensed Copy</h1>
    <p class="watermark-text">This copy is licensed to:</p>
    <p class="watermark-text"><strong>${watermarkText}</strong></p>
  </div>
</body>
</html>`;

        zip.file(watermarkPath, watermarkXhtml);

        const manifestMatch = contentOpfXml.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/);
        if (!manifestMatch) {
          throw new Error('Invalid EPUB: manifest not found');
        }

        const manifestContent = manifestMatch[1];
        const newManifestItem = `\n    <item id="${watermarkId}" href="${watermarkFilename}" media-type="application/xhtml+xml"/>`;
        const updatedManifest = manifestContent + newManifestItem;
        contentOpfXml = contentOpfXml.replace(
          /<manifest[^>]*>[\s\S]*?<\/manifest>/,
          `<manifest>${updatedManifest}\n  </manifest>`
        );

        const spineMatch = contentOpfXml.match(/<spine([^>]*)>([\s\S]*?)<\/spine>/);
        if (!spineMatch) {
          throw new Error('Invalid EPUB: spine not found');
        }

        const spineAttrs = spineMatch[1];
        const spineContent = spineMatch[2];
        const newSpineItemref = `\n    <itemref idref="${watermarkId}"/>`;
        const updatedSpine = newSpineItemref + spineContent;
        contentOpfXml = contentOpfXml.replace(
          /<spine[^>]*>[\s\S]*?<\/spine>/,
          `<spine${spineAttrs}>${updatedSpine}\n  </spine>`
        );

        zip.file(contentOpfPath, contentOpfXml);

        console.log('EPUB watermark added successfully');
      } catch (error) {
        console.error('Error adding watermark to EPUB:', error);
        throw error;
      }

      const watermarkedEpub = await zip.generateAsync({ type: 'uint8array' });

      await supabase.from('downloads').insert({
        signup_id: signup.id,
        book_id: book.id,
        watermark_uid: watermarkUid,
        file_format: 'epub',
        ip,
        user_agent: userAgent,
      });

      return new Response(watermarkedEpub, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/epub+zip',
          'Content-Disposition': `inline; filename="${book.slug}-GP-stamped.epub"`,
          'Cache-Control': 'no-store',
        },
      });
    } else {
      const { data: masterData, error: storageError } = await supabase.storage
        .from('master_pdfs')
        .download(book.storage_key);

      if (storageError || !masterData) {
        console.error('Storage error:', storageError);
        return new Response(
          JSON.stringify({ error: 'Master PDF not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const master = await masterData.arrayBuffer();

      const pdf = await PDFDocument.load(master);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const footer = `${signup.email} \u2022 ${book.title} \u2022 ${watermarkUid}`;
      const size = 9;

      for (const page of pdf.getPages()) {
        const { width } = page.getSize();
        const textWidth = font.widthOfTextAtSize(footer, size);
        const x = (width - textWidth) / 2;
        const y = 20;
        page.drawText(footer, {
          x,
          y,
          size,
          font,
          color: rgb(0.2, 0.2, 0.2),
          opacity: 0.65,
        });
      }

      pdf.setTitle(book.title);
      pdf.setProducer(`GP Stamped \u2022 ${signup.email}`);

      const stamped = await pdf.save();

      await supabase.from('downloads').insert({
        signup_id: signup.id,
        book_id: book.id,
        watermark_uid: watermarkUid,
        file_format: 'pdf',
        ip,
        user_agent: userAgent,
      });

      return new Response(stamped, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${book.slug}-GP-stamped.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});