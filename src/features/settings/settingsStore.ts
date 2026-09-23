export interface UserSettings {
  servicesSold: string[];
  customServices: string[];
  userName: string;
  companyName: string;
  email: string;
  phone: string;
  website: string;
  defaultCta: string;
  preferredTone: 'Friendly' | 'Direct' | 'Professional' | 'Casual';
  preferredLength: 'concise' | 'standard' | 'detailed';
  customPricing: Record<string, string>; // e.g. { "AI Video Advertising": "$1,200/mo" }
  webhookUrl?: string; // GoHighLevel / Zapier / HubSpot inbound webhook
  webhookAuthHeader?: string; // Optional Bearer token or API key
  webhookPlatform?: 'gohighlevel' | 'zapier' | 'hubspot' | 'generic';
}

export const DEFAULT_SERVICES = [
  'AI Video Advertising',
  'Website Redesign',
  'SEO',
  'Google Ads',
  'Meta Ads',
  'Social Media Content',
  'Review Generation',
  'Lead Nurturing & CRM Automation',
  'Commercial Photography & Video'
];

export const DEFAULT_SETTINGS: UserSettings = {
  servicesSold: ['AI Video Advertising', 'Website Redesign', 'SEO', 'Review Generation', 'Lead Nurturing & CRM Automation'],
  customServices: [],
  userName: 'Alex Rivers',
  companyName: 'Apex Growth Studio',
  email: 'alex@apexgrowthstudio.com',
  phone: '(555) 382-9910',
  website: 'https://apexgrowthstudio.com',
  defaultCta: 'Would you be open to checking out a 30-second concept we storyboarded for you?',
  preferredTone: 'Direct',
  preferredLength: 'concise',
  customPricing: {
    'AI Video Advertising': '$1,500 starter pack',
    'Website Redesign': '$2,800 turnkey',
    'Review Generation': '$450/mo'
  },
  webhookUrl: '',
  webhookAuthHeader: '',
  webhookPlatform: 'gohighlevel'
};

const SETTINGS_KEY = 'prospectlens_user_settings';

export async function getUserSettings(): Promise<UserSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([SETTINGS_KEY], (res) => {
        resolve(res[SETTINGS_KEY] ? { ...DEFAULT_SETTINGS, ...res[SETTINGS_KEY] } : DEFAULT_SETTINGS);
      });
    });
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => resolve());
    });
  } else {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
