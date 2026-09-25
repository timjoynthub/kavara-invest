# Kavara Invest

Branded investor-resource capture and download pages for `invest.kavaracapital.com`.

## Current scope

- `/get-blueprint/` → `/thank-you-blueprint/`
- `/small-group-entry/` → `/small-group-entry-download/`
- `/10-questions-for-investors/` → `/10-questions-for-investors-download/`

The existing Systeme.io deployment and DNS remain unchanged until a Cloudflare preview is reviewed and explicitly approved.

## Architecture

- Astro generates the branded static pages.
- A Cloudflare Pages Function at `/api/subscribe` validates submissions and calls MailerLite server-side.
- MailerLite remains the contact, consent and marketing-automation system of record.
- Existing Kavara-hosted guide URLs remain the download destinations during the first migration.
- Cloudflare Turnstile protects capture forms.

## Local work

```sh
npm install
npm run dev
npm test
npm run build
```

For complete local form testing, use Wrangler Pages development with local test values. Never use a production MailerLite token for browser-side code or commit it to Git.

## Required Cloudflare configuration

Encrypted secrets:

- `MAILERLITE_API_TOKEN`
- `TURNSTILE_SECRET_KEY`

Environment variables (group IDs are identifiers, but keeping deployment configuration outside source avoids accidental cross-environment mistakes):

- `MAILERLITE_GROUP_BLUEPRINT`
- `MAILERLITE_GROUP_SMALL_GROUP`
- `MAILERLITE_GROUP_TEN_QUESTIONS`
- `PUBLIC_TURNSTILE_SITE_KEY` at build time

The matching MailerLite custom fields must exist before forms are activated: `resource_requested`, `capture_source`, `consent_version`, `consent_timestamp`, `page_url`, `referrer`, and the five standard `utm_*` fields.

## Deployment and rollback

1. Create a private GitHub repository and Git-connected Cloudflare Pages project.
2. Build command: `npm run build`; output directory: `dist`.
3. Configure preview values using test MailerLite groups and Turnstile test keys.
4. Validate every route, form outcome, automation and download on the `pages.dev` preview.
5. Record the existing `invest.kavaracapital.com` CNAME and Systeme.io funnel state.
6. Only after explicit approval, attach `invest.kavaracapital.com` to the new project and change the DNS record.
7. To roll back, restore the recorded CNAME to its prior Systeme.io/CloudFront destination. Do not delete the old funnels during the validation period.

## Private material

Source PDFs, spreadsheets, screenshots, ZIP archives, exports, environment files and reference folders are excluded by `.gitignore`. They must not be copied into `public/`; everything in `public/` is published.
