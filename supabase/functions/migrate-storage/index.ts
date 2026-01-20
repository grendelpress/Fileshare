import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { authorId } = await req.json();

    if (!authorId) {
      return new Response(
        JSON.stringify({ error: "authorId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = {
      masterPdfs: { copied: [], errors: [] },
      epubs: { copied: [], errors: [] },
      coverImages: { copied: [], errors: [] },
    };

    // Get all books for this author
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("storage_key, epub_storage_key, cover_image_key")
      .eq("author_id", authorId);

    if (booksError) throw booksError;

    // Migrate master PDFs
    for (const book of books || []) {
      if (book.storage_key) {
        const oldPath = book.storage_key.replace(`${authorId}/`, "");
        const newPath = book.storage_key;

        try {
          // Download the file
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("master_pdfs")
            .download(oldPath);

          if (downloadError) {
            if (downloadError.message.includes("not found")) {
              // File already at new location or doesn't exist
              results.masterPdfs.copied.push(`${oldPath} (already migrated or not found)`);
              continue;
            }
            throw downloadError;
          }

          // Upload to new location
          const { error: uploadError } = await supabase.storage
            .from("master_pdfs")
            .upload(newPath, fileData, { upsert: true });

          if (uploadError) throw uploadError;

          results.masterPdfs.copied.push(`${oldPath} -> ${newPath}`);

          // Delete old file
          await supabase.storage.from("master_pdfs").remove([oldPath]);
        } catch (error: any) {
          results.masterPdfs.errors.push(`${oldPath}: ${error.message}`);
        }
      }

      // Migrate EPUBs
      if (book.epub_storage_key) {
        const oldPath = book.epub_storage_key.replace(`${authorId}/`, "");
        const newPath = book.epub_storage_key;

        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("master_pdfs")
            .download(oldPath);

          if (downloadError) {
            if (downloadError.message.includes("not found")) {
              results.epubs.copied.push(`${oldPath} (already migrated or not found)`);
              continue;
            }
            throw downloadError;
          }

          const { error: uploadError } = await supabase.storage
            .from("master_pdfs")
            .upload(newPath, fileData, { upsert: true });

          if (uploadError) throw uploadError;

          results.epubs.copied.push(`${oldPath} -> ${newPath}`);

          await supabase.storage.from("master_pdfs").remove([oldPath]);
        } catch (error: any) {
          results.epubs.errors.push(`${oldPath}: ${error.message}`);
        }
      }

      // Migrate cover images
      if (book.cover_image_key) {
        const oldPath = book.cover_image_key.replace(`${authorId}/`, "");
        const newPath = book.cover_image_key;

        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("cover_images")
            .download(oldPath);

          if (downloadError) {
            if (downloadError.message.includes("not found")) {
              results.coverImages.copied.push(`${oldPath} (already migrated or not found)`);
              continue;
            }
            throw downloadError;
          }

          const { error: uploadError } = await supabase.storage
            .from("cover_images")
            .upload(newPath, fileData, { upsert: true });

          if (uploadError) throw uploadError;

          results.coverImages.copied.push(`${oldPath} -> ${newPath}`);

          await supabase.storage.from("cover_images").remove([oldPath]);
        } catch (error: any) {
          results.coverImages.errors.push(`${oldPath}: ${error.message}`);
        }
      }
    }

    // Migrate series cover images
    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select("cover_image_key")
      .eq("author_id", authorId)
      .not("cover_image_key", "is", null);

    if (seriesError) throw seriesError;

    for (const s of series || []) {
      const oldPath = s.cover_image_key.replace(`${authorId}/`, "");
      const newPath = s.cover_image_key;

      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("cover_images")
          .download(oldPath);

        if (downloadError) {
          if (downloadError.message.includes("not found")) {
            results.coverImages.copied.push(`${oldPath} (already migrated or not found)`);
            continue;
          }
          throw downloadError;
        }

        const { error: uploadError } = await supabase.storage
          .from("cover_images")
          .upload(newPath, fileData, { upsert: true });

        if (uploadError) throw uploadError;

        results.coverImages.copied.push(`${oldPath} -> ${newPath}`);

        await supabase.storage.from("cover_images").remove([oldPath]);
      } catch (error: any) {
        results.coverImages.errors.push(`${oldPath}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});