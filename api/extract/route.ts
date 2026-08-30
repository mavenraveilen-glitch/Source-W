import { NextRequest, NextResponse } from 'next/server';
import { extractSource } from '@/lib/extract';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json(
        { status: 'error', html: '', css: [], js: [], message: 'URL is required' },
        { status: 400 }
      );
    }

    // Basic SSRF guard: block private/localhost targets
    try {
      const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
      ) {
        return NextResponse.json(
          { status: 'error', html: '', css: [], js: [], message: 'Private/local URLs are not allowed' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { status: 'error', html: '', css: [], js: [], message: 'Invalid URL' },
        { status: 400 }
      );
    }

    const result = await extractSource(url);
    const code = result.status === 'success' ? 200 : 422;
    return NextResponse.json(result, { status: code });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { status: 'error', html: '', css: [], js: [], message },
      { status: 500 }
    );
  }
}
