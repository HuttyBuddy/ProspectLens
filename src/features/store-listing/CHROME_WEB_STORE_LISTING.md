# Chrome Web Store Developer Listing Package: ProspectLens

Official submission assets, metadata, descriptions, category tags, single-purpose statement, and permission justifications for the Google Chrome Web Store Developer Dashboard.

---

## 📋 1. Basic Metadata (Form Inputs)

| Field | Character Limit | Form Submission Value | Character Count |
| :--- | :--- | :--- | :--- |
| **Extension Name** | 45 chars max | `ProspectLens: B2B Lead & Video Ad Copilot` | 41 chars |
| **Short Description** | 132 chars max | `Audit business websites, generate client growth audit PDFs, and sync leads with custom outreach hooks to your CRM via webhooks.` | 124 chars |
| **Version** | Semantic | `1.0.0` | - |
| **Primary Category** | Dropdown | `Productivity` | - |
| **Secondary Category** | Dropdown | `Workflow & Planning` | - |
| **Language** | Dropdown | `English (United States)` | - |
| **Pricing** | Model | `Freemium (Free tier + Pro & Agency subscriptions)` | - |
| **Official Website** | URL | `https://huttybuddy.github.io/ProspectLens/` | - |
| **Support URL** | URL | `https://huttybuddy.github.io/ProspectLens/` | - |
| **Privacy Policy URL** | URL | `https://huttybuddy.github.io/ProspectLens/privacy.html` | - |

---

## 🔍 2. Search Keywords & Tags
```
b2b prospecting, lead generation, cold email, agency copilot, website audit, conversion rate optimization, video ad generator, client audit pdf, seo audit, local seo, marketing agency, sales prospecting, outreach copywriter, sales pipeline
```

---

## 📝 3. Detailed Store Description (Copy & Paste)

```markdown
Turn any local business website into a qualified sales opportunity, client-ready PDF audit, and high-converting video ad pitch in seconds.

ProspectLens is the premier B2B prospecting copilot built directly into your Chrome Side Panel. Designed specifically for digital agencies, B2B solopreneurs, and video creators, ProspectLens analyzes any local business website as you browse, identifies high-ticket marketing weaknesses, and creates immediate deliverables you can pitch to close $1,500–$5,000/mo retainers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ CORE FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. Instant 4-Pillar Website Conversion Audit
Stop manually checking websites. In 1 click, ProspectLens scans:
• Conversion Architecture (Click-to-call, lead capture forms, quote schedulers)
• Video & Modern Creative (Short-form video presence, video embeds, social video gaps)
• Social Proof & Authority (Customer review ratings, review volume, schema markup)
• Mobile & On-Page SEO (Meta tags, viewport scaling, local search readiness)
Get an objective 0–100 Conversion Health Score and instant diagnosis of the top revenue bottlenecks costing that business money.

📄 2. 1-Page Client PDF Audit Report
Generate a beautifully formatted, vector-sharp A4 PDF growth audit stamped with your agency's name, logo, contact info, and calendar booking link. Hand it to prospective clients during cold calls, discovery meetings, or follow-up emails to demonstrate tangible value before you ask for a dime.

🎬 3. AI Short-Form Video Commercial Prompts
Local businesses are losing customer attention because they lack modern short-form video commercials. ProspectLens generates cinematic, shot-by-shot text-to-video prompts (tailored for modern generative AI video platforms) complete with camera angles, lighting, sound design, and local branding hooks ready to pitch.

✉️ 4. Personalized Cold Outreach Copywriter
Generate personalized cold emails, SMS hooks, LinkedIn DMs, and cold call battle-cards based on specific weaknesses observed on the business's actual website. No generic templates—every message references real observations (e.g. missing speed-to-lead follow-up or lack of social proof).

⚡ 5. 1-Click Agency CRM & Inbound Webhook Sync
Send verified prospect data, 4-pillar audit scores, identified bottlenecks, and customized outreach scripts directly into your CRM, inbound webhook endpoints, or automation workflows in a single click.

📥 6. Bulk CSV / Excel Exporter for Cold Outreach Sequencers
Export your saved leads with computed audit scores, pain point variables, and personalized subject lines formatted directly for cold outreach sequencers and sales engagement platforms. Uses UTF-8 BOM encoding so files open cleanly in spreadsheet software without corrupted characters.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 WHO IS PROSPECTLENS FOR?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Digital Marketing & Lead Gen Agencies: Land high-ticket retainers by pitching specific, proven conversion gaps.
• Video Creators & Editors: Pitch $1,500+ monthly short-form video commercial packages to local home services and contractors.
• Cold Email Specialists: Personalize cold email campaigns at scale with real website audit data.
• B2B Solopreneurs & Consultants: Build a predictable sales pipeline without expensive data scraper subscriptions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 SUBSCRIPTION PLANS & TIERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Free Plan: 5 free website scans per month, basic prospecting scorecard, and up to 3 lead exports.
• Pro Solopreneur ($49/month): Unlimited website scans, unlimited pipeline leads, 1-click Client PDF Audits, full sequencer-ready CSV export, and video ad generator.
• Agency Scale ($119/month): Everything in Pro plus 1-Click CRM Webhook direct dispatch, whitelabel client PDF branding, and priority updates.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PRIVACY & ETHICAL COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Strict Non-Scrape Policy: ProspectLens strictly enforces zero scraping or prospecting of legal/law practices or real estate businesses.
• Local-First Privacy: Your saved leads and configuration settings are stored locally in your browser. We never sell or broker your prospecting data.
```

---

## 🛡️ 4. Single-Purpose Statement & Permissions Justifications

### Single Purpose Statement (Required for CWS Review)
> "The single purpose of ProspectLens is to extract public marketing information from local business websites in the active browser tab to calculate conversion audit scores, generate client PDF deliverables, and sync qualified leads into sales pipelines."

### Permission Justifications (Submit in Developer Console)

1. **`sidePanel`**:
   - **Justification**: "ProspectLens functions as an interactive sidepanel companion. It allows marketers and agencies to keep the extension open alongside target local business websites for simultaneous browsing, scorecard evaluation, and outreach generation without obstructing the main webpage."

2. **`activeTab`**:
   - **Justification**: "ProspectLens only accesses webpage content when the user actively triggers the 'Analyze' button on an active webpage. It reads visible text, meta tags, and contact links (phone/email) to calculate conversion audit metrics."

3. **`scripting`**:
   - **Justification**: "Used in conjunction with `activeTab` to execute a lightweight content extraction script that identifies public on-page elements (e.g. meta descriptions, schema markup, phone links) on user command."

4. **`storage`**:
   - **Justification**: "Used locally via `chrome.storage.local` to securely save the user's pipeline leads, agency whitelabel contact details, and application preferences directly on their device."

5. **`host_permissions` (`http://*/*`, `https://*/*`)**:
   - **Justification**: "Users prospect across diverse local business websites and contractors across the web. Host permissions are required so that the extension's content script can analyze whichever public business website the user chooses to inspect."

---

## 🖼️ 5. Promotional & Storefront Visual Assets

All generated visual assets follow Google Chrome Web Store specifications, with deep slate dark mode styling, glowing cyan/blue accents, emerald green performance badges, and zero purple or indigo:

| Asset Name | Standard Dimensions | File Location | Purpose |
| :--- | :--- | :--- | :--- |
| **Marquee Banner** | 1400 x 560 px | [`assets/marquee-banner-1400x560.jpg`](file:///f:/ProspectLens/src/features/store-listing/assets/marquee-banner-1400x560.jpg) | Featured promotional banner on the Chrome Web Store homepage and collection headers. |
| **Small Promo Tile** | 440 x 280 px | [`assets/promo-tile-small-440x280.jpg`](file:///f:/ProspectLens/src/features/store-listing/assets/promo-tile-small-440x280.jpg) | Extension card graphic displayed in category search results and recommendations. |
| **Screenshot 1: Overview & Audit** | 1280 x 800 px (JPEG) | [`assets/screenshot-1-overview-1280x800.jpg`](file:///f:/ProspectLens/src/features/store-listing/assets/screenshot-1-overview-1280x800.jpg) | Turn any local business website into an opportunity with live sidepanel copilot. |
| **Screenshot 2: PDF Deliverables** | 1280 x 800 px (JPEG) | [`assets/screenshot-2-audit-pdf-1280x800.jpg`](file:///f:/ProspectLens/src/features/store-listing/assets/screenshot-2-audit-pdf-1280x800.jpg) | 1-click professional client growth audit PDF reports with 4-pillar scorecard. |
| **Screenshot 3: Outreach & Video Ads** | 1280 x 800 px (JPEG) | [`assets/screenshot-3-outreach-and-ad-1280x800.jpg`](file:///f:/ProspectLens/src/features/store-listing/assets/screenshot-3-outreach-and-ad-1280x800.jpg) | Cold email pitches, SMS hooks, and AI vertical video storyboard angles. |
| **Screenshot 4: CRM Sync & Export** | 1280 x 800 px (JPEG) | [`assets/screenshot-4-crm-sync-export-1280x800.jpg`](file:///f:/ProspectLens/src/features/store-listing/assets/screenshot-4-crm-sync-export-1280x800.jpg) | 1-click CRM webhook sync and bulk CSV export ready for outreach sequencers. |
| **Extension Store Icon** | 128 x 128 px (PNG) | [`public/icons/icon-128.png`](file:///f:/ProspectLens/public/icons/icon-128.png) | 96x96 inner squircle icon with 16px transparent padding on all 4 sides. |

---

## 🚀 6. Step-by-Step Chrome Web Store Submission Guide

1. **Sign in to Google Chrome Web Store Developer Dashboard**:
   - Navigate to `https://chrome.google.com/webstore/devconsole`.
   - Pay the one-time $5 developer registration fee if it is a new Google developer account.
2. **Upload Package**:
   - Click **"Add new item"** and upload [`prospectlens-v1.0.0.zip`](file:///f:/ProspectLens/prospectlens-v1.0.0.zip).
3. **Fill Listing Information**:
   - Copy and paste the **Extension Name**, **Short Description**, and **Detailed Description** from Sections 1 and 3 of this document.
   - Select Category: **Productivity**.
4. **Upload Store Assets**:
   - Upload `assets/promo-tile-small-440x280.jpg` as the Small Promo Tile (440x280).
   - Upload `assets/marquee-banner-1400x560.jpg` as the Marquee Promo Tile (1400x560).
   - Upload all 4 screenshots from `assets/`:
     - `screenshot-1-overview-1280x800.jpg`
     - `screenshot-2-audit-pdf-1280x800.jpg`
     - `screenshot-3-outreach-and-ad-1280x800.jpg`
     - `screenshot-4-crm-sync-export-1280x800.jpg`
   - Upload `public/icons/icon-128.png` as Store Icon (128x128).
5. **Privacy Tab**:
   - Paste the **Single Purpose Statement** and **Permission Justifications** from Section 4.
   - Set Data Usage: Select "No, I do not sell user data".
   - Provide Privacy Policy link: `https://huttybuddy.github.io/ProspectLens/privacy.html`
6. **Submit for Review**:
   - Click **"Submit for Review"**. Google standard review typically takes 24–48 hours.
