# Kavara Invest

Branded investor-resource capture and download pages for `invest.kavaracapital.com`.

The site root redirects to the main Kavara Capital resources hub at
`https://www.kavaracapital.com/resources`; the Astro project hosts only the
individual capture and download journeys.

## Current scope

- `/get-blueprint/` → `/thank-you-blueprint/`
- `/small-group-entry/` → `/small-group-entry-download/`
- `/10-questions-for-investors/` → `/10-questions-for-investors-download/`

Production moved from Systeme.io to the Git-connected Cloudflare Pages project on
26 September 2026 after the preview and all three resource flows were approved.
The former Systeme.io deployment has been retained for rollback.

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
- `MAILERLITE_GROUP_NURTURE_ENTRY`
- `TALLY_WEBHOOK_SECRET` (encrypted secret used to verify signed Tally webhook requests)
- `TALLY_CONTACT_FORM_ID` (optional; defaults to `r1AGb6p` for the current contact form)
- `PUBLIC_TURNSTILE_SITE_KEY` at build time

Every successful resource form submission is assigned to both its resource-specific
group and the shared nurture-entry group. The live welcome-and-nurture automation
should use only the shared nurture-entry group as its `Joins group` trigger. Resource
downloads remain available immediately on the website thank-you pages and do not
require delivery-email automations.

The Tally contact form connects through a signed webhook at
`/api/tally-contact`. Only the configured form is accepted, and a submission is
added to the shared nurture-entry group only when its marketing-consent checkbox
is selected. Investment range, timeline and message remain available in Tally;
MailerLite receives the subscriber name, email, consent record and capture source.

The matching MailerLite custom fields must exist before forms are activated: `resource_requested`, `capture_source`, `consent_version`, `consent_timestamp`, `page_url`, `referrer`, and the five standard `utm_*` fields.

## Deployment and rollback

Current production configuration:

- Repository: `timjoynthub/kavara-invest` (private)
- Cloudflare Pages project: `kavara-invest`
- Pages deployment: `https://kavara-invest.pages.dev`
- Production domain: `https://invest.kavaracapital.com`
- The production site root redirects to `https://www.kavaracapital.com/resources`.
- MailerLite automations for all three resources were active at cutover.

1. Create a private GitHub repository and Git-connected Cloudflare Pages project.
2. Build command: `npm run build`; output directory: `dist`.
3. Configure preview values using test MailerLite groups and Turnstile test keys.
4. Validate every route, form outcome, automation and download on the `pages.dev` preview.
5. Record the existing `invest.kavaracapital.com` CNAME and Systeme.io funnel state.
6. Only after explicit approval, attach `invest.kavaracapital.com` to the new project and change the DNS record.
7. To roll back, remove `invest.kavaracapital.com` from the `kavara-invest`
   Pages custom domains and restore the DNS-only `invest` CNAME to
   `d2ny50o2qf5dmb.cloudfront.net`. Do not delete the old funnels during the
   validation period.

After any future production deployment, verify `/`, all six capture/download
routes, Turnstile, MailerLite group assignment and one automation delivery.

## Private material

Source PDFs, spreadsheets, screenshots, ZIP archives, exports, environment files and reference folders are excluded by `.gitignore`. They must not be copied into `public/`; everything in `public/` is published.
