import React, { useState, useEffect } from 'react';
import { extractFromCurrentPage } from '../features/extractor/pageExtractor';
import { isRestrictedProspect } from '../features/extractor/exclusionPolicy';
import { WebsiteExtractionResult } from '../features/extractor/types';
import { evaluateOpportunities } from '../features/opportunities/opportunityRules';
import { ServiceOpportunity, OpportunityEngineResult } from '../features/opportunities/opportunityTypes';
import { OpportunityCard } from '../features/opportunities/OpportunityCard';
import { AuditList } from '../features/audit/AuditList';
import { OutreachPanel } from '../features/outreach/OutreachPanel';
import { AdConceptPanel } from '../features/adConcept/AdConceptPanel';
import { ProspectsTable } from '../features/pipeline/ProspectsTable';
import {
  getSavedProspects,
  saveProspect,
  computePipelineStats
} from '../features/pipeline/storageService';
import { SavedProspect, PipelineStats } from '../features/pipeline/pipelineTypes';
import {
  getUserSettings,
  UserSettings,
  DEFAULT_SETTINGS
} from '../features/settings/settingsStore';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { DEMO_BUSINESSES } from '../features/demo/demoData';
import {
  getLicenseState,
  recordScanUsage,
  canSaveProspect
} from '../features/monetization/licenseStore';
import {
  UserLicenseState,
  DEFAULT_LICENSE_STATE
} from '../features/monetization/types';
import { syncPaymentStatus } from '../features/monetization/paymentService';
import { ScanUsagePill } from '../features/monetization/ScanUsagePill';
import { UpgradeModal } from '../features/monetization/UpgradeModal';
import {
  AuditPreviewModal,
  buildClientAuditData,
  ClientAuditData
} from '../features/reports';
import { CrmSyncModal } from '../features/integrations';
import {
  AdminPanelModal,
  AdminAuthModal,
  isAdminAuthenticated,
  initGlobalErrorHandlers,
  initLogger,
  logInfo,
  logWarn,
  logError
} from '../features/admin';
import { Button } from '../shared/components/Button';
import { Badge } from '../shared/components/Badge';
import {
  Search,
  Sparkles,
  Send,
  Clapperboard,
  Bookmark,
  Users,
  Settings as SettingsIcon,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Play,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Download
} from 'lucide-react';

type TabType = 'Overview' | 'Opportunities' | 'Outreach' | 'Ad Concept' | 'Prospects' | 'Settings';

export const SidePanelApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [extraction, setExtraction] = useState<WebsiteExtractionResult | null>(null);
  const [opportunitiesResult, setOpportunitiesResult] = useState<OpportunityEngineResult | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ServiceOpportunity | undefined>();
  const [savedProspects, setSavedProspects] = useState<SavedProspect[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats>({
    total: 0,
    readyToContact: 0,
    contacted: 0,
    interested: 0,
    won: 0
  });
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [license, setLicense] = useState<UserLicenseState>(DEFAULT_LICENSE_STATE);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeFeatureContext, setUpgradeFeatureContext] = useState<string | undefined>();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [clientAuditData, setClientAuditData] = useState<ClientAuditData | null>(null);
  const [isCrmSyncModalOpen, setIsCrmSyncModalOpen] = useState(false);
  const [crmSyncProspect, setCrmSyncProspect] = useState<SavedProspect | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [brandClickCount, setBrandClickCount] = useState(0);
  const [lastBrandClickTime, setLastBrandClickTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');

  const handleOpenCrmSync = (prospect?: SavedProspect) => {
    if (prospect) {
      setCrmSyncProspect(prospect);
    } else if (savedProspects.length > 0) {
      setCrmSyncProspect(savedProspects[0]);
    } else if (extraction) {
      const synthetic: SavedProspect = {
        id: 'active-preview',
        businessName: extraction.identity.businessName,
        domain: extraction.identity.domain,
        websiteUrl: extraction.identity.websiteUrl,
        phone: extraction.identity.contacts.phones[0] || '',
        email: extraction.identity.contacts.emails[0] || '',
        location: extraction.identity.contacts.city || '',
        category: extraction.identity.category,
        socials: extraction.identity.socials || {},
        dateDiscovered: new Date().toISOString().slice(0, 10),
        lastActivity: new Date().toISOString().slice(0, 10),
        notes: '',
        auditItems: extraction.audit.items,
        opportunities: opportunitiesResult?.topOpportunities || [],
        status: 'Ready to Contact'
      };
      setCrmSyncProspect(synthetic);
    }
    setIsCrmSyncModalOpen(true);
  };

  const handleOpenClientAudit = () => {
    if (!extraction) return;
    if (extraction.isRestricted) {
      setErrorMsg('Compliance Notice: Client audit reports cannot be generated for law or real estate businesses.');
      return;
    }
    try {
      const data = buildClientAuditData(extraction, opportunitiesResult, userSettings);
      setClientAuditData(data);
      setIsAuditModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not generate client audit report.');
    }
  };

  const handleGenerateProspectAudit = (prospect: SavedProspect) => {
    if (prospect.isRestricted || isRestrictedProspect(prospect.businessName, prospect.domain, prospect.category)) {
      setErrorMsg('Compliance Notice: Client audit reports cannot be generated for law or real estate businesses.');
      return;
    }
    const syntheticExtraction: WebsiteExtractionResult = {
      url: prospect.websiteUrl || `https://${prospect.domain}`,
      domain: prospect.domain,
      extractedData: {
        businessName: prospect.businessName,
        industry: prospect.category,
        contactPhone: prospect.phone,
        contactEmail: prospect.email,
        reviewRating: 4.7,
        reviewCount: 28,
        metaDescription: prospect.tagline || `${prospect.businessName} - professional service provider.`,
        callsToAction: ['Get Estimate'],
        videoEmbeds: []
      },
      identity: {
        businessName: prospect.businessName,
        tagline: prospect.tagline,
        contacts: {
          phones: prospect.phone ? [prospect.phone] : [],
          emails: prospect.email ? [prospect.email] : [],
          addresses: prospect.location ? [prospect.location] : []
        },
        servicesOffered: prospect.chosenService ? [prospect.chosenService] : []
      },
      audit: {
        summary: 'Prospect conversion and growth assessment.',
        items: []
      }
    };

    try {
      const data = buildClientAuditData(syntheticExtraction, null, userSettings);
      setClientAuditData(data);
      setIsAuditModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not generate client audit report.');
    }
  };

  // Initial Load
  useEffect(() => {
    initGlobalErrorHandlers();
    initLogger();
    logInfo('SYSTEM', 'ProspectLens Sidepanel loaded');
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const settings = await getUserSettings();
    setUserSettings(settings);

    const lic = await getLicenseState();
    setLicense(lic);

    // Silently check ExtensionPay/Stripe if running in live browser
    syncPaymentStatus().then((result) => {
      if (result.updatedLicense) {
        setLicense(result.updatedLicense);
      }
    }).catch(() => {});

    const prospects = await getSavedProspects();
    setSavedProspects(prospects);
    setPipelineStats(computePipelineStats(prospects));

    // Check if administrator has an active authenticated session
    isAdminAuthenticated().then((authed) => {
      setIsAdminAuthed(authed);
    }).catch(() => {});

    // Try inspecting the active browser tab
    checkActiveTabAndExtract(settings);
  };

  // Admin shortcut Ctrl+Shift+A or Cmd+Shift+A to toggle admin sandbox / prompt passcode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdminAuthed) {
          setIsAdminModalOpen((prev) => !prev);
        } else {
          setIsAdminAuthModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminAuthed]);

  // Secret 5-click brand logo trigger for admin unlock
  const handleBrandLogoClick = () => {
    const now = Date.now();
    if (now - lastBrandClickTime > 3000) {
      setBrandClickCount(1);
      setLastBrandClickTime(now);
    } else {
      const newCount = brandClickCount + 1;
      setBrandClickCount(newCount);
      setLastBrandClickTime(now);
      if (newCount >= 5) {
        setBrandClickCount(0);
        if (isAdminAuthed) {
          setIsAdminModalOpen(true);
        } else {
          setIsAdminAuthModalOpen(true);
        }
      }
    }
  };

  const refreshProspects = async () => {
    const prospects = await getSavedProspects();
    setSavedProspects(prospects);
    setPipelineStats(computePipelineStats(prospects));
  };

  const getActiveBrowserTab = async (): Promise<chrome.tabs.Tab | undefined> => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return undefined;
    try {
      const [tabCurrent] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabCurrent?.id && tabCurrent.url) return tabCurrent;
      const [tabFocused] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tabFocused;
    } catch {
      return undefined;
    }
  };

  const isInternalUrl = (url?: string) => {
    if (!url) return true;
    return (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:') ||
      url.startsWith('view-source:') ||
      url.startsWith('chrome-search://')
    );
  };

  const checkActiveTabAndExtract = async (settings: UserSettings) => {
    const active = await getActiveBrowserTab();
    if (active?.url) {
      setCurrentTabUrl(active.url);
      if (isInternalUrl(active.url)) {
        // Quietly load demo business for immediate UI preview without error alert
        loadDemoBusiness(DEMO_BUSINESSES[0], settings);
      } else {
        handleAnalyzeTab(active.id, settings);
      }
    } else {
      loadDemoBusiness(DEMO_BUSINESSES[0], settings);
    }
  };

  const handleAnalyzeTab = async (tabId?: number, settings = userSettings) => {
    setIsLoading(true);
    setErrorMsg(null);

    let targetTab: chrome.tabs.Tab | undefined;
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      if (tabId) {
        try {
          targetTab = await chrome.tabs.get(tabId);
        } catch {
          targetTab = await getActiveBrowserTab();
        }
      } else {
        targetTab = await getActiveBrowserTab();
      }
    }

    if (!targetTab || !targetTab.id) {
      setIsLoading(false);
      loadDemoBusiness(DEMO_BUSINESSES[0], settings);
      return;
    }

    if (isInternalUrl(targetTab.url)) {
      setIsLoading(false);
      setErrorMsg('Navigate to any live business website (http:// or https://) and click Analyze.');
      loadDemoBusiness(DEMO_BUSINESSES[0], settings);
      return;
    }

    const scanCheck = await recordScanUsage();
    if (!scanCheck.allowed) {
      setIsLoading(false);
      setUpgradeFeatureContext('Unlimited Monthly Scans');
      setIsUpgradeModalOpen(true);
      return;
    }
    setLicense(scanCheck.state);

    const targetId = targetTab.id;
    setCurrentTabUrl(targetTab.url || '');

    // 1. Send message to content script (already loaded via manifest content_scripts)
    chrome.tabs.sendMessage(targetId, { action: 'EXTRACT_PAGE_DATA' }, (response) => {
      if (!chrome.runtime.lastError && response?.success && response?.data) {
        setIsLoading(false);
        processExtractedData(response.data, settings);
        return;
      }

      // 2. Programmatic injection fallback using self-contained IIFE
      if (chrome.scripting?.executeScript) {
        chrome.scripting.executeScript(
          {
            target: { tabId: targetId },
            files: ['features/extractor/contentScript.js']
          },
          () => {
            if (chrome.runtime.lastError) {
              console.warn('[ProspectLens] executeScript note:', chrome.runtime.lastError.message);
              setIsLoading(false);
              setErrorMsg(`Could not inspect this page: ${chrome.runtime.lastError.message}`);
              loadDemoBusiness(DEMO_BUSINESSES[0], settings);
              return;
            }

            setTimeout(() => {
              chrome.tabs.sendMessage(targetId, { action: 'EXTRACT_PAGE_DATA' }, (retryRes) => {
                setIsLoading(false);
                if (!chrome.runtime.lastError && retryRes?.success && retryRes?.data) {
                  processExtractedData(retryRes.data, settings);
                } else {
                  setErrorMsg('Page structure could not be read. Loaded demo business instead.');
                  loadDemoBusiness(DEMO_BUSINESSES[0], settings);
                }
              });
            }, 60);
          }
        );
      } else {
        setIsLoading(false);
        loadDemoBusiness(DEMO_BUSINESSES[0], settings);
      }
    });
  };

  const processExtractedData = (data: WebsiteExtractionResult, settings = userSettings) => {
    setExtraction(data);
    const oppResult = evaluateOpportunities(data, {
      servicesSold: settings.servicesSold,
      customPricing: settings.customPricing
    });
    setOpportunitiesResult(oppResult);
    if (oppResult.topOpportunities.length > 0) {
      setSelectedOpportunity(oppResult.topOpportunities[0]);
    }
  };

  const loadDemoBusiness = (demo: typeof DEMO_BUSINESSES[0], settings = userSettings) => {
    processExtractedData(demo.data, settings);
    setCurrentTabUrl(demo.url);
  };

  const handleSaveProspect = async () => {
    if (!extraction) return;
    if (extraction.isRestricted) {
      setErrorMsg('Policy Violation: Law and estate businesses cannot be saved to the prospecting pipeline.');
      return;
    }

    const prospectCheck = await canSaveProspect(savedProspects.length);
    if (!prospectCheck.allowed) {
      setUpgradeFeatureContext(`Unlimited Pipeline Storage (${savedProspects.length}/${prospectCheck.limit} Free Limit Reached)`);
      setIsUpgradeModalOpen(true);
      return;
    }

    const p = extraction.identity;

    const newProspect: SavedProspect = {
      id: `prospect_${Date.now()}`,
      businessName: p.businessName,
      domain: p.domain,
      websiteUrl: p.websiteUrl,
      phone: p.contacts.phones[0],
      email: p.contacts.emails[0],
      location: p.contacts.addresses[0] || (p.contacts.city ? `${p.contacts.city}, ${p.contacts.state || ''}` : undefined),
      category: p.category,
      socials: p.socials as any,
      dateDiscovered: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      notes: `Discovered on ${new Date().toLocaleDateString()}. Initial focus: ${selectedOpportunity?.service || 'Video Advertising'}`,
      auditItems: extraction.audit.items,
      opportunities: opportunitiesResult?.allOpportunities || [],
      chosenService: selectedOpportunity?.service,
      status: 'Ready to Contact'
    };

    await saveProspect(newProspect);
    await refreshProspects();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSelectPitchFromOpp = (opp: ServiceOpportunity) => {
    setSelectedOpportunity(opp);
    setActiveTab('Outreach');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white text-xs antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleBrandLogoClick}
            title={isAdminAuthed ? 'ProspectLens (Admin Unlocked)' : 'ProspectLens'}
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-900/40">
              P
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block leading-tight">
                ProspectLens
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">B2B Copilot</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ScanUsagePill
              license={license}
              onOpenUpgradeModal={() => {
                setUpgradeFeatureContext(undefined);
                setIsUpgradeModalOpen(true);
              }}
            />

            <Button
              variant="outline"
              size="xs"
              onClick={() => handleAnalyzeTab()}
              isLoading={isLoading}
              title="Analyze active webpage"
            >
              <RefreshCw className="w-3 h-3 mr-1 text-cyan-400" /> Analyze
            </Button>

            <Button
              variant="primary"
              size="xs"
              onClick={handleSaveProspect}
              disabled={!extraction || extraction.isRestricted}
              title={extraction?.isRestricted ? 'Saving disabled: Law and estate businesses are excluded by policy' : undefined}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-300 mr-1" /> Saved!
                </>
              ) : (
                <>
                  <Bookmark className="w-3 h-3 mr-1" /> Save Prospect
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Current Active Business / Domain Info */}
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px]">
          <div className="flex items-center gap-1.5 truncate max-w-[210px]">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white truncate">
              {extraction?.identity.businessName || 'No business loaded'}
            </span>
            <span className="text-slate-400">({extraction?.identity.domain || 'offline'})</span>
          </div>

          <div className="shrink-0">
            {extraction && (
              <Badge
                variant={extraction.isRestricted ? 'red' : 'cyan'}
                className="text-[10px] px-1.5 py-0 font-medium"
              >
                {extraction.isRestricted ? 'Restricted Policy' : extraction.identity.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Demo Mode switcher bar */}
        <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-800/80 overflow-x-auto text-[11px]">
          <span className="text-slate-400 shrink-0 flex items-center gap-0.5">
            <Play className="w-2.5 h-2.5 text-cyan-400" /> Demo:
          </span>
          {DEMO_BUSINESSES.map((d) => (
            <button
              key={d.id}
              onClick={() => loadDemoBusiness(d)}
              className={`px-1.5 py-0.5 rounded cursor-pointer whitespace-nowrap transition ${
                extraction?.identity.domain === d.data.identity.domain
                  ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {d.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="sticky top-[107px] z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-1 flex items-center justify-between text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('Overview')}
          className={`px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap ${
            activeTab === 'Overview'
              ? 'text-cyan-400 border-b-2 border-cyan-400 rounded-b-none'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('Opportunities')}
          className={`px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'Opportunities'
              ? 'text-cyan-400 border-b-2 border-cyan-400 rounded-b-none'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Opportunities
          {opportunitiesResult && (
            <span className="bg-blue-950 text-cyan-300 border border-blue-800/80 rounded-full px-1.5 py-0 text-[10px]">
              {opportunitiesResult.topOpportunities.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('Outreach')}
          className={`px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap ${
            activeTab === 'Outreach'
              ? 'text-cyan-400 border-b-2 border-cyan-400 rounded-b-none'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Outreach
        </button>
        <button
          onClick={() => setActiveTab('Ad Concept')}
          className={`px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap ${
            activeTab === 'Ad Concept'
              ? 'text-cyan-400 border-b-2 border-cyan-400 rounded-b-none'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ad Concept
        </button>
        <button
          onClick={() => setActiveTab('Prospects')}
          className={`px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'Prospects'
              ? 'text-cyan-400 border-b-2 border-cyan-400 rounded-b-none'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Pipeline
          {pipelineStats.total > 0 && (
            <span className="bg-slate-800 text-slate-200 rounded-full px-1.5 py-0 text-[10px]">
              {pipelineStats.total}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('Settings')}
            className={`p-1 rounded-md transition cursor-pointer ${
              activeTab === 'Settings' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
            title="User Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
          {isAdminAuthed && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="p-1 rounded-md transition cursor-pointer text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30"
              title="Admin & Developer Sandbox"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 pb-8 space-y-4">
        {errorMsg && (
          <div className="bg-amber-950/80 border border-amber-500/40 text-amber-200 rounded-xl p-3 text-xs flex items-start gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'Overview' && extraction && (
          extraction.isRestricted ? (
            <div className="space-y-4">
              {/* Compliance Restriction Shield */}
              <div className="bg-slate-900/95 border border-rose-500/40 rounded-xl p-4 shadow-md space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-500/40 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Scraping Restricted by Policy</h3>
                    <span className="text-[11px] text-rose-300 font-medium">
                      {extraction.restrictionCategory || 'Law & Estate Services Excluded'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    ProspectLens is strictly configured to <strong className="text-white">never scrape, extract, or store information</strong> from law firms, attorneys, legal services, real estate agencies, or estate businesses.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {extraction.restrictionReason || 'Scraping and contact collection are disabled for this business category.'}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Contact Info Extracted:</span>
                    <span className="font-semibold text-emerald-400">0 (Blocked)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Marketing Signals Scraped:</span>
                    <span className="font-semibold text-emerald-400">0 (Blocked)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pipeline Storage:</span>
                    <span className="font-semibold text-rose-400">Disabled</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1-Click Client Audit Report Banner */}
              <div className="bg-gradient-to-r from-blue-950/60 to-slate-900/90 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Client Growth Audit</h4>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-900/60 text-cyan-300 border border-blue-500/30">
                        1-PAGE PDF
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Branded conversion scorecard, bottlenecks & high-ROI pitch roadmap
                    </p>
                  </div>
                </div>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleOpenClientAudit}
                  className="font-bold shadow-xs whitespace-nowrap"
                >
                  <Download className="w-3 h-3 mr-1 text-cyan-300" />
                  PDF Audit
                </Button>
              </div>

              {/* Identity Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{extraction.identity.businessName}</h3>
                    <p className="text-[11px] text-slate-400">{extraction.identity.tagline || extraction.identity.description?.slice(0, 80)}</p>
                  </div>
                  <a
                    href={extraction.identity.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-cyan-400 p-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Contacts Grid */}
                <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {extraction.identity.contacts.phones.length > 0
                        ? extraction.identity.contacts.phones.join(', ')
                        : <span className="text-slate-500 italic">Not found</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {extraction.identity.contacts.emails.length > 0
                        ? extraction.identity.contacts.emails.join(', ')
                        : <span className="text-slate-500 italic">Not found</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {extraction.identity.contacts.addresses[0] ||
                        (extraction.identity.contacts.city
                          ? `${extraction.identity.contacts.city}, ${extraction.identity.contacts.state || ''}`
                          : <span className="text-slate-500 italic">Not found</span>)}
                    </span>
                  </div>
                </div>

                {/* Services Offered */}
                {extraction.identity.servicesOffered.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Services Offered
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {extraction.identity.servicesOffered.map((svc) => (
                        <span
                          key={svc}
                          className="bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-medium"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* What Should I Sell Them? Quick Preview */}
              {opportunitiesResult && opportunitiesResult.topOpportunities.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Top Pitch Recommendation
                    </h3>
                    <button
                      onClick={() => setActiveTab('Opportunities')}
                      className="text-[11px] text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      View All ({opportunitiesResult.allOpportunities.length})
                    </button>
                  </div>
                  <OpportunityCard
                    opportunity={opportunitiesResult.topOpportunities[0]}
                    isTopPick={true}
                    rank={1}
                    onSelectForPitch={handleSelectPitchFromOpp}
                  />
                </div>
              )}

              {/* Lightweight Evidence-Based Marketing Audit */}
              <div>
                <h3 className="text-xs font-bold text-white mb-2">Marketing & Conversion Audit</h3>
                <AuditList items={extraction.audit.items} summary={extraction.audit.summary} />
              </div>
            </div>
          )
        )}

        {/* TAB 2: OPPORTUNITIES */}
        {activeTab === 'Opportunities' && extraction?.isRestricted && (
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-5 text-center space-y-2">
            <ShieldAlert className="w-7 h-7 text-rose-400 mx-auto" />
            <h4 className="font-bold text-white text-xs">Opportunity Evaluation Disabled</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Service opportunity evaluation is blocked for law and estate businesses under ProspectLens compliance policy.
            </p>
          </div>
        )}
        {activeTab === 'Opportunities' && !extraction?.isRestricted && opportunitiesResult && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                What Should I Sell Them?
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ranked by evidence from {opportunitiesResult.businessOverview.name}'s digital audit and your services in Settings.
              </p>
            </div>

            <div className="space-y-3">
              {opportunitiesResult.topOpportunities.map((opp, idx) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isTopPick={idx === 0}
                  rank={idx + 1}
                  onSelectForPitch={handleSelectPitchFromOpp}
                />
              ))}
            </div>

            {opportunitiesResult.allOpportunities.length > 3 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200 block mb-2">
                  Additional Pitch Angles:
                </span>
                <div className="space-y-2.5">
                  {opportunitiesResult.allOpportunities.slice(3).map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      onSelectForPitch={handleSelectPitchFromOpp}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OUTREACH */}
        {activeTab === 'Outreach' && extraction?.isRestricted && (
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-5 text-center space-y-2">
            <ShieldAlert className="w-7 h-7 text-rose-400 mx-auto" />
            <h4 className="font-bold text-white text-xs">Outreach Generation Prohibited</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              ProspectLens is strictly configured to not generate outreach for law firms or estate businesses.
            </p>
          </div>
        )}
        {activeTab === 'Outreach' && !extraction?.isRestricted && extraction && opportunitiesResult && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-cyan-400" />
                Personalized Outreach Generator
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Short, specific outreach referencing real audit findings with no fake claims.
              </p>
            </div>

            <OutreachPanel
              identity={extraction.identity}
              opportunities={opportunitiesResult.allOpportunities}
              selectedOpportunity={selectedOpportunity}
              userSettings={userSettings}
              isPro={license.isPro}
              onOpenUpgradeModal={(ctx) => {
                setUpgradeFeatureContext(ctx);
                setIsUpgradeModalOpen(true);
              }}
              onSaveMessage={(msg) => {
                // Also update prospect notes if saved
                console.log('Outreach copied/saved:', msg);
              }}
            />
          </div>
        )}

        {/* TAB 4: AD CONCEPT */}
        {activeTab === 'Ad Concept' && extraction?.isRestricted && (
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-5 text-center space-y-2">
            <ShieldAlert className="w-7 h-7 text-rose-400 mx-auto" />
            <h4 className="font-bold text-white text-xs">Video Ad Concepts Disabled</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Video ad concept generation and Google Flow / Veo prompts are blocked for law and estate businesses under ProspectLens compliance policy.
            </p>
          </div>
        )}
        {activeTab === 'Ad Concept' && !extraction?.isRestricted && extraction && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Clapperboard className="w-4 h-4 text-cyan-400" />
                AI Video Ad Concept Generator
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Local-service video ad storyboard, scene breakdown, and Veo/Google Flow prompt.
              </p>
            </div>

            <AdConceptPanel
              identity={extraction.identity}
              opportunity={selectedOpportunity}
              isPro={license.isPro}
              onOpenUpgradeModal={(ctx) => {
                setUpgradeFeatureContext(ctx);
                setIsUpgradeModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 5: PIPELINE */}
        {activeTab === 'Prospects' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Saved Prospects Pipeline
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Track status from New discovery to Proposal and Won contracts.
              </p>
            </div>

            <ProspectsTable
              prospects={savedProspects}
              stats={pipelineStats}
              onRefresh={refreshProspects}
              isPro={license.isPro}
              isAgency={license.isAgency}
              settings={userSettings}
              onGenerateAuditPdf={handleGenerateProspectAudit}
              onOpenCrmSync={handleOpenCrmSync}
              onOpenUpgradeModal={(ctx) => {
                setUpgradeFeatureContext(ctx);
                setIsUpgradeModalOpen(true);
              }}
              onSelectProspect={(p) => {
                // Load this prospect into the copilot view
                const matched = DEMO_BUSINESSES.find((d) => d.data.identity.domain === p.domain);
                if (matched) {
                  processExtractedData(matched.data);
                } else if (extraction) {
                  // Keep current extraction
                }
                setActiveTab('Overview');
              }}
            />
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'Settings' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
                User Preferences & Services
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure what services you sell, pricing ranges, and your sender profile.
              </p>
            </div>

            <SettingsPanel
              settings={userSettings}
              license={license}
              onLicenseUpdated={setLicense}
              isAdminAuthenticated={isAdminAuthed}
              onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
              onOpenAdminPanel={() => setIsAdminModalOpen(true)}
              onOpenUpgradeModal={(ctx) => {
                setUpgradeFeatureContext(ctx);
                setIsUpgradeModalOpen(true);
              }}
              onSave={(updated) => {
                setUserSettings(updated);
                if (extraction) {
                  processExtractedData(extraction, updated);
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Monetization Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        license={license}
        onLicenseUpdated={(updated) => setLicense(updated)}
        featureContext={upgradeFeatureContext}
      />

      {/* Client Audit Preview & Download Modal */}
      <AuditPreviewModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditData={clientAuditData}
        isPro={license.isPro}
        onOpenUpgradeModal={(ctx) => {
          setIsAuditModalOpen(false);
          setUpgradeFeatureContext(ctx || 'Client Audit PDF Reports');
          setIsUpgradeModalOpen(true);
        }}
      />

      {/* Agency CRM & Webhook Sync Modal */}
      <CrmSyncModal
        isOpen={isCrmSyncModalOpen}
        onClose={() => setIsCrmSyncModalOpen(false)}
        prospect={crmSyncProspect}
        settings={userSettings}
        isAgency={license.isAgency}
        onOpenUpgradeModal={(ctx) => {
          setIsCrmSyncModalOpen(false);
          setUpgradeFeatureContext(ctx || 'Direct GoHighLevel & CRM Webhook Sync');
          setIsUpgradeModalOpen(true);
        }}
        onOpenSettings={() => {
          setActiveTab('Settings');
        }}
        onSyncSuccess={() => {
          refreshProspects();
        }}
      />

      {/* Admin Passcode Authentication Gate */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onAuthenticated={() => {
          setIsAdminAuthed(true);
          setIsAdminAuthModalOpen(false);
          setIsAdminModalOpen(true);
        }}
      />

      {/* Developer & Admin Sandbox Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        license={license}
        settings={userSettings}
        onLicenseUpdated={(updated) => setLicense(updated)}
        onLockSession={() => setIsAdminAuthed(false)}
        onTriggerPdfAudit={() => {
          setIsAdminModalOpen(false);
          handleOpenAuditModal();
        }}
        onTriggerCrmSync={() => {
          setIsAdminModalOpen(false);
          handleOpenCrmSync(savedProspects[0]);
        }}
        onTriggerExport={() => {
          setIsAdminModalOpen(false);
          setActiveTab('Prospects');
        }}
        savedProspectsCount={savedProspects.length}
      />
    </div>
  );
};
