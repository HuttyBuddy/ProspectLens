# ProspectLens 🔍

> **Turn any local business website into a qualified sales opportunity.**

ProspectLens is a production-ready B2B prospecting copilot Chrome Extension (Manifest V3) for freelancers, marketing agencies, consultants, video creators, and sales professionals targeting local service businesses.

---

## 🚀 Key Features

* **Instant Business Extraction:** Discovers business name, category, phone numbers (`tel:`), emails (`mailto:`), physical addresses, social profiles, and Schema.org JSON-LD. Missing data is cleanly reported as `Not found` with zero fabrication.
* **Evidence-Based Marketing Audit:** Performs a 12-point conversion & presence audit (headlines, CTAs, video marketing, lead forms, social proof, licensing, structured data, viewport configuration, live chat). Results are classified as **Strong**, **Present**, **Weak**, **Missing**, or **Unable to determine** with exact justifications.
* **"What Should I Sell Them?" Opportunity Engine:** Ranks the top 3 high-probability pitch angles tailored to business weaknesses and the specific services you sell (configured in your Settings).
* **Personalized Outreach Generator:** Drafts targeted, non-spammy outreach across 5 channels (**Email**, **Instagram/FB DM**, **LinkedIn**, **SMS**, **Cold-call Opener**) with selectable tones (**Direct**, **Friendly**, **Professional**, **Casual**) and instant adjustments (**Shorter**, **More Casual**, **More Direct**).
* **AI Video Ad Concept Generator:** Generates 8s to 30s local commercial concepts with hook strategy, shot-by-shot storyboards, scene timings, audio/sfx cues, voiceover script, closing end-card design, and a ready-to-use copyable prompt for Google Flow / Veo.
* **Prospect Pipeline CRM:** Track saved prospects locally with stage progression (**New**, **Researching**, **Ready to Contact**, **Contacted**, **Follow Up**, **Interested**, **Meeting**, **Proposal**, **Won**, **Lost**), real-time search, category filters, and custom notes.
* **Instant Demo Mode:** One-click toggling across 3 built-in realistic business fixtures (**Roofing contractor**, **Mold remediation company**, **Kitchen remodeling company**) allowing immediate evaluation offline or on internal pages.

---

## 🛡️ Chrome Permissions Justification

In compliance with the Chrome Web Store Minimum Permissions Policy:

| Permission | Why It Is Needed |
| :--- | :--- |
| `sidePanel` | Provides the copilot interface right beside the active website without interrupting page navigation. |
| `activeTab` | Temporarily reads the public markup of the specific tab the user explicitly analyzes. |
| `scripting` | Injects the non-invasive DOM extraction content script into the active page upon user request. |
| `storage` | Stores your saved prospect pipeline, preferences, and custom service pricing locally in `chrome.storage.local`. |
| `host_permissions` (`http://*/*`, `https://*/*`) | Allows analysis of standard HTTP and HTTPS local business websites requested by the user. |

---

## 🛠️ Quickstart & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Unit & Integration Tests
```bash
npm test
```

### 3. Run End-to-End Puppeteer Extension Tests
```bash
node scripts/verifyBrowser.mjs
node scripts/testScenarios.mjs
```

### 4. Build Extension
```bash
npm run build
```
This builds the TypeScript & React application into the `dist/` directory with Manifest V3 configuration and mirrored icons.

---

## 📦 How to Load Unpacked Extension in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. In the top-right corner, toggle **Developer mode** to **ON**.
3. Click the **Load unpacked** button in the top-left.
4. Select the directory:
   ```
   f:\ProspectLens\dist
   ```
5. Click on the puzzle piece icon (Extensions) in your Chrome toolbar and pin **ProspectLens**.
6. Visit any local contractor or business website (or test on any tab) and click the **ProspectLens** icon to open the Side Panel!

---

## 📦 Packaging for Chrome Web Store

To generate a clean `.zip` archive ready for submission to the Chrome Web Store Developer Dashboard:
```bash
npm run package
```
This produces `prospectlens-v1.0.0.zip` in the root workspace directory.

---

## 🔒 Security & Privacy Posture

- **No Secret Key Exposure:** No private API credentials exist in client-side code.
- **Client-Side First:** All data is processed in the client context; saved prospects remain securely in your local browser storage.
- **XSS & Injection Protection:** All extracted data renders through sanitized React virtual DOM text nodes with strict Manifest V3 Content Security Policy.
- For full disclosures, see [PRIVACY.md](file:///f:/ProspectLens/PRIVACY.md).
