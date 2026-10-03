interface Env {
  [key: string]: string;
  MAILERLITE_API_TOKEN: string;
  TURNSTILE_SECRET_KEY: string;
  MAILERLITE_GROUP_BLUEPRINT: string;
  MAILERLITE_GROUP_SMALL_GROUP: string;
  MAILERLITE_GROUP_TEN_QUESTIONS: string;
  MAILERLITE_GROUP_NURTURE_ENTRY: string;
}

interface Submission {
  email?: string;
  firstName?: string;
  consent?: string;
  company?: string;
  resource?: string;
  sourcePath?: string;
  consentVersion?: string;
  pageUrl?: string;
  referrer?: string;
  'cf-turnstile-response'?: string;
  [key: string]: unknown;
}

const allowedOrigins = new Set([
  'https://invest.kavaracapital.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321'
]);

const groupKeyByResource = {
  blueprint: 'MAILERLITE_GROUP_BLUEPRINT',
  'small-group': 'MAILERLITE_GROUP_SMALL_GROUP',
  'ten-questions': 'MAILERLITE_GROUP_TEN_QUESTIONS'
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

async function verifyTurnstile(secret: string, token: string, ip: string | null) {
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  return response.ok
    ? response.json() as Promise<{ success: boolean; 'error-codes'?: string[] }>
    : { success: false, 'error-codes': [`siteverify-http-${response.status}`] };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigins.has(origin) && !origin.endsWith('.pages.dev')) return json({ message: 'Invalid request origin.' }, 403);

  let body: Submission;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid form submission.' }, 400);
  }

  if (body.company) return json({ ok: true });
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ message: 'Please enter a valid email address.' }, 400);
  if (body.consent !== 'yes') return json({ message: 'Please confirm your email consent.' }, 400);
  if (!(body.resource && body.resource in groupKeyByResource)) return json({ message: 'Unknown resource.' }, 400);

  if (!env.MAILERLITE_API_TOKEN || !env.TURNSTILE_SECRET_KEY) return json({ message: 'This preview is not connected yet. Please try again later.' }, 503);
  const turnstile = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, String(body['cf-turnstile-response'] || ''), request.headers.get('CF-Connecting-IP'));
  if (!turnstile.success) {
    const hostname = new URL(request.url).hostname;
    const previewDetail = hostname.endsWith('.pages.dev') && turnstile['error-codes']?.length
      ? ` (${turnstile['error-codes'].join(', ')})`
      : '';
    return json({ message: `Please complete the security check and try again.${previewDetail}` }, 400);
  }

  const groupEnvName = groupKeyByResource[body.resource as keyof typeof groupKeyByResource];
  const groupId = env[groupEnvName];
  if (!groupId) return json({ message: 'This resource is not connected yet. Please try again later.' }, 503);
  const nurtureGroupId = env.MAILERLITE_GROUP_NURTURE_ENTRY;
  if (!nurtureGroupId) return json({ message: 'The nurture journey is not connected yet. Please try again later.' }, 503);

  const fields: Record<string, string> = {
    resource_requested: String(body.resource),
    capture_source: String(body.sourcePath || ''),
    consent_version: String(body.consentVersion || ''),
    consent_timestamp: new Date().toISOString(),
    page_url: String(body.pageUrl || '').slice(0, 500),
    referrer: String(body.referrer || '').slice(0, 500)
  };
  if (body.firstName) fields.name = String(body.firstName).trim().slice(0, 80);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    if (body[key]) fields[key] = String(body[key]).slice(0, 255);
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const clientIp = request.headers.get('CF-Connecting-IP') || undefined;

  const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.MAILERLITE_API_TOKEN}`,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      email,
      fields,
      groups: [groupId, nurtureGroupId],
      status: 'active',
      subscribed_at: now,
      opted_in_at: now,
      ...(clientIp ? { ip_address: clientIp, optin_ip: clientIp } : {})
    })
  });

  if (!response.ok) {
    console.error('MailerLite subscriber request failed', response.status, await response.text());
    return json({ message: 'We could not complete the request. Please try again.' }, 502);
  }

  return json({ ok: true });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  return onRequestPost(context);
};
