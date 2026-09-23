import { initBackgroundPaymentListener } from '../features/monetization/paymentService';

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
