interface Env {
  MAILERLITE_API_TOKEN: string;
  MAILERLITE_GROUP_NURTURE_ENTRY: string;
  TALLY_WEBHOOK_SECRET: string;
  TALLY_CONTACT_FORM_ID?: string;
}

interface TallyField {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
}

interface TallyWebhook {
  eventId?: string;
  eventType?: string;
  createdAt?: string;
  data?: {
    responseId?: string;
    submissionId?: string;
    formId?: string;
    formName?: string;
    createdAt?: string;
    fields?: TallyField[];
  };
}

const DEFAULT_CONTACT_FORM_ID = 'r1AGb6p';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function verifySignature(secret: string, rawBody: string, receivedSignature: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = bytesToBase64(new Uint8Array(signature));
  if (expected.length !== receivedSignature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ receivedSignature.charCodeAt(index);
  }
  return mismatch === 0;
}

function normalizedLabel(field: TallyField) {
  return String(field.label || '').trim().toLowerCase();
}

function findField(fields: TallyField[], matcher: (label: string, field: TallyField) => boolean) {
  return fields.find((field) => matcher(normalizedLabel(field), field));
}

function valueAsText(field?: TallyField) {
  if (!field) return '';
  if (Array.isArray(field.value)) return field.value.map(String).join(', ');
  return String(field.value ?? '').trim();
}

function hasConsent(field?: TallyField) {
  if (!field) return false;
  const values = Array.isArray(field.value) ? field.value : [field.value];
  return values.some((value) => {
    if (value === true || value === 1) return true;
    return ['yes', 'true', 'checked', 'i agree'].includes(String(value ?? '').trim().toLowerCase());
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.TALLY_WEBHOOK_SECRET || !env.MAILERLITE_API_TOKEN || !env.MAILERLITE_GROUP_NURTURE_ENTRY) {
    return json({ message: 'Webhook configuration is incomplete.' }, 503);
  }

  const rawBody = await request.text();
  const receivedSignature = request.headers.get('tally-signature') || '';
  if (!receivedSignature || !(await verifySignature(env.TALLY_WEBHOOK_SECRET, rawBody, receivedSignature))) {
    return json({ message: 'Invalid webhook signature.' }, 401);
  }

  let payload: TallyWebhook;
  try {
    payload = JSON.parse(rawBody) as TallyWebhook;
  } catch {
    return json({ message: 'Invalid webhook payload.' }, 400);
  }

  if (payload.eventType !== 'FORM_RESPONSE') return json({ ok: true, ignored: true });
  const expectedFormId = env.TALLY_CONTACT_FORM_ID || DEFAULT_CONTACT_FORM_ID;
  if (payload.data?.formId !== expectedFormId) return json({ message: 'Unexpected Tally form.' }, 403);

  const fields = payload.data.fields || [];
  const emailField = findField(fields, (label, field) => field.type === 'INPUT_EMAIL' || label === 'email' || label === 'email address');
  const nameField = findField(fields, (label) => label === 'first name' || label === 'name');
  const consentField = findField(fields, (label) => label.includes('consent') || label.includes('receive relevant kavara') || label.includes('investor insights'));

  const email = valueAsText(emailField).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ message: 'Submission has no valid email address.' }, 400);
  if (!hasConsent(consentField)) return json({ ok: true, subscribed: false, reason: 'no-marketing-consent' });

  const firstName = valueAsText(nameField).slice(0, 80);
  const submittedAt = payload.data?.createdAt || payload.createdAt || new Date().toISOString();
  const now = new Date(submittedAt).toISOString().slice(0, 19).replace('T', ' ');

  const customFields: Record<string, string> = {
    capture_source: 'tally-contact-form',
    consent_version: 'tally-contact-2026-10-03',
    consent_timestamp: submittedAt,
    resource_requested: 'contact-enquiry'
  };
  if (firstName) customFields.name = firstName;

  const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.MAILERLITE_API_TOKEN}`,
      'content-type': 'application/json',
      accept: 'application/json'
    },
    body: JSON.stringify({
      email,
      fields: customFields,
      groups: [env.MAILERLITE_GROUP_NURTURE_ENTRY],
      status: 'active',
      subscribed_at: now,
      opted_in_at: now
    })
  });

  if (!response.ok) {
    console.error('MailerLite Tally subscriber request failed', response.status, await response.text());
    return json({ message: 'MailerLite subscriber update failed.' }, 502);
  }

  return json({ ok: true, subscribed: true });
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  return onRequestPost(context);
};
