# Privacy Policy for ProspectLens

**Effective Date:** September 19, 2026  
**Last Updated:** September 19, 2026  
**Application:** ProspectLens Chrome Extension  

ProspectLens is committed to protecting your privacy and the integrity of your browsing experience. This Privacy Policy details our data handling practices, permissions, and security posture.

---

## 1. What ProspectLens Does

ProspectLens is a client-side prospecting copilot designed for sales professionals, freelancers, consultants, and marketing agencies. When the user explicitly requests an analysis by opening the side panel or clicking "Analyze", ProspectLens inspects the currently active webpage to extract publicly available business information (company name, public contact numbers, emails, addresses, and marketing audit signals) to assist you in preparing personalized outreach and sales proposals.

---

## 2. Information We Analyze & How It Is Handled

### A. Public Business Information
- **Business Identity:** Company name, domain, category, public social media profile links.
- **Public Contact Details:** Visible telephone numbers (`tel:` links), public email addresses (`mailto:` links), and physical business addresses displayed on the webpage.
- **Website Audit Signals:** Structural webpage elements such as headings, call-to-action buttons, presence of lead capture forms, video elements, customer testimonials, and schema.org structured data.

### B. What We NEVER Collect
- **No Browsing History:** We never track, monitor, or record your browsing activity or visited URLs outside of explicit, user-initiated analysis.
- **No Keystrokes or Form Data:** We do not read keystrokes or inspect private input forms entered by the user.
- **No Authentication or Credentials:** We do not read passwords, session cookies, payment details, or personal accounts.
- **No Continuous Background Crawling:** ProspectLens operates on-demand only when triggered by the user.

---

## 3. Chrome Extension Permissions Justification

In compliance with the Chrome Web Store Minimum Permissions Policy:

| Permission | Reason / Technical Need |
| :--- | :--- |
| `sidePanel` | Required to provide the primary copilot user interface alongside the active tab without obstructing webpage navigation. |
| `activeTab` | Grants temporary access to inspect the DOM of the single webpage the user is actively viewing when they open the side panel or request an analysis. |
| `scripting` | Enables programmatic injection of the lightweight extraction script into the active tab to read public HTML elements. |
| `storage` | Stores your saved prospect pipeline, custom services, user preferences, and pricing notes locally in your browser (`chrome.storage.local`). |
| `host_permissions` (`http://*/*`, `https://*/*`) | Allows the extension to extract public business markup on HTTP and HTTPS business websites when requested by the user. |

---

## 4. Local-First Data Storage

All saved prospects, outreach drafts, ad concept scripts, and configuration settings are stored locally on your device within your browser's dedicated extension storage. ProspectLens does not transmit your prospect pipeline or notes to third-party databases.

---

## 5. Security Practices

- **Zero Secret Exposure:** ProspectLens requires no client-side secret keys.
- **Safe Rendering:** All dynamic business text is safely rendered using sanitized React text nodes. No unsanitized `innerHTML` injection is permitted.
- **Strict Content Security Policy (CSP):** The extension strictly complies with Manifest V3 CSP, disallowing arbitrary string execution (`eval`) and remote script downloads.

---

## 6. Contact Us

If you have questions regarding this Privacy Policy or ProspectLens, please contact:
- **Email:** privacy@prospectlens.app
- **Repository:** https://github.com/prospectlens/prospectlens
