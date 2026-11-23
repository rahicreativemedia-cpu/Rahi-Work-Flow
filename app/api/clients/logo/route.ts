import { getAuthenticatedUser } from '@/lib/session';
import { hasFullAdminAccess } from '@/lib/permissions';
import { supabaseAdmin, isSupabaseServerConfigured } from '@/lib/supabase';
import { privateJsonResponse, privateErrorResponse } from '@/lib/api-response';


const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const LOGO_BUCKET = 'client-logos';

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.user) {
      return privateErrorResponse(
        auth.error || 'Unauthorized: Active session required',
        auth.status || 401
      );
    }

    // Only Admin and Manager may manage client branding
    if (!hasFullAdminAccess(auth.user)) {
      return privateErrorResponse(
        'Forbidden: Admin or Manager permission required to upload client logo',
        403
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return privateErrorResponse('No logo file provided', 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return privateErrorResponse(
        'Invalid file format. Allowed formats: PNG, JPG, WebP',
        400
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return privateErrorResponse('File size exceeds maximum limit of 2MB', 400);
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `${Date.now()}-${sanitizedBase}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage if configured
    if (isSupabaseServerConfigured()) {
      try {
        // Attempt upload to Supabase Storage bucket
        const { error: uploadError } = await supabaseAdmin.storage
          .from(LOGO_BUCKET)
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabaseAdmin.storage
            .from(LOGO_BUCKET)
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) {
            return privateJsonResponse({
              success: true,
              url: publicData.publicUrl,
              fileName,
            });
          }
        }
      } catch (storageErr) {
        console.warn('Supabase Storage upload warning:', storageErr);
      }
    }

    // Data URI fallback for environments where storage bucket is not yet provisioned
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    return privateJsonResponse({
      success: true,
      url: dataUrl,
      fileName,
    });
  } catch (error: any) {
    return privateErrorResponse('Failed to upload client logo', 500, error);
  }
}
