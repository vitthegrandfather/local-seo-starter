import { validateContact } from '@/lib/contact-validation';

const MAX_BODY_BYTES = 16_384;
const responseHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: responseHeaders });
}

async function readLimitedBody(request: Request): Promise<string> {
  if (Number(request.headers.get('content-length') ?? '0') > MAX_BODY_BYTES)
    throw new RangeError('body_limit');
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError('body_limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function POST(request: Request) {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  ) {
    return reply({ ok: false, error: 'unsupported_content_type' }, 415);
  }
  // Public form, same-origin browser requests only. CLI clients may omit Origin.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return reply({ ok: false, error: 'invalid_origin' }, 403);

  let input: unknown;
  try {
    input = JSON.parse(await readLimitedBody(request));
  } catch (error) {
    return reply(
      { ok: false, error: error instanceof RangeError ? 'body_too_large' : 'invalid_json' },
      error instanceof RangeError ? 413 : 400,
    );
  }
  const result = validateContact(input);
  if (!result.valid) return reply({ ok: false, error: 'validation', errors: result.errors }, 422);
  if (result.spam) return reply({ ok: true, mode: 'demo' });

  const endpoint = process.env.FORM_ENDPOINT?.trim();
  if (!endpoint) {
    // Deliberately redacted: no contact details, free text, IP, or district in logs.
    console.info('[LocalSEO Starter] Demo contact', {
      mode: 'demo',
      namePresent: Boolean(result.data.name),
      phonePresent: Boolean(result.data.phone),
      emailPresent: Boolean(result.data.email),
      messageLength: result.data.message.length,
      consent: result.data.consent,
    });
    return reply({ ok: true, mode: 'demo' });
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
    if (endpointUrl.protocol !== 'https:' || endpointUrl.username || endpointUrl.password)
      throw new Error('invalid_endpoint');
  } catch {
    return reply({ ok: false, error: 'configuration' }, 503);
  }

  const { website: _honeypot, ...payload } = result.data;
  void _honeypot;
  try {
    const upstream = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(process.env.FORM_ENDPOINT_TOKEN
          ? { Authorization: `Bearer ${process.env.FORM_ENDPOINT_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ ...payload, source: 'aquafix-pro-demo' }),
      signal: AbortSignal.timeout(8_000),
      redirect: 'error',
      cache: 'no-store',
    });
    const accepted = upstream.ok;
    await upstream.body?.cancel();
    if (!accepted) return reply({ ok: false, error: 'upstream_unavailable' }, 502);
    return reply({ ok: true, mode: 'delivered' });
  } catch {
    return reply({ ok: false, error: 'upstream_unavailable' }, 502);
  }
}
