import { initBackgroundPaymentListener } from '../features/monetization/paymentService';
import { getDueSchedules, RESCAN_TICK_ALARM } from '../features/rescan/rescanScheduler';

// Chrome Manifest V3 Service Worker for ProspectLens

// Initialize ExtensionPay background listener for Stripe payment sync
initBackgroundPaymentListener().catch((err) =>
  console.log('[ProspectLens] Payment background init notice:', err)
);

// Enable side panel to open on action click
chrome.sidePanel
  ?.setPanelBehavior?.({ openPanelOnActionClick: true })
  .catch((error: unknown) => console.log('SidePanel behavior registration:', error));

chrome.runtime.onInstalled.addListener(() => {
  console.log('ProspectLens extension installed successfully.');
});

// Communication relay between side panel and active tab if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'GET_ACTIVE_TAB_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      sendResponse({
        url: activeTab?.url || '',
        title: activeTab?.title || '',
        id: activeTab?.id
      });
    });
    return true; // async
  }
});

// ── Scheduled re-scans ─────────────────────────────────────────
// The service worker owns the clock. It cannot parse HTML (no DOM in
// MV3 workers), so on each tick it checks for due schedules and asks
// any open side panel to execute them (side panels also check for due
// schedules on every open, covering the closed-panel case).
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== RESCAN_TICK_ALARM) return;
  try {
    const due = await getDueSchedules();
    if (due.length === 0) return;
    console.log(`[ProspectLens] ${due.length} re-scan schedule(s) due — notifying side panel.`);
    chrome.runtime
      .sendMessage({ action: 'PROSPECTLENS_RUN_DUE_RESCANS' })
      .catch(() => {
        // No open side panel to receive it; it will run on next panel open.
      });
  } catch (err) {
    console.log('[ProspectLens] Rescan tick error:', err);
  }
});
