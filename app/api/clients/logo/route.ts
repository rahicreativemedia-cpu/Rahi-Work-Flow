import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/session';
import { hasFullAdminAccess } from '@/lib/permissions';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  try {
    const auth = getAuthenticatedUser(request);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized: Active session required' },
        { status: auth.status || 401 }
      );
    }

    // Only Admin and Manager may manage client branding
    if (!hasFullAdminAccess(auth.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager permission required to upload client logo' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed formats: PNG, JPG, WebP' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 2MB' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Sanitize file name and create unique path
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const sanitizedBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `${Date.now()}-${sanitizedBase}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/logos/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload client logo' },
      { status: 500 }
    );
  }
}
