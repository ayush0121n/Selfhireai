// SelfHire.ai Manifest V3 Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log("SelfHire.ai Extension Installed & Active.");
});

// Enable side panel on click if supported
if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((error) => console.error(error));
}

// Message routing between content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_API_STATUS") {
    fetch("http://127.0.0.1:8001/api/v1/health")
      .then((res) => res.json())
      .then((data) => sendResponse({ online: true, port: 8001, data }))
      .catch(() => {
        fetch("http://127.0.0.1:8000/api/v1/health")
          .then((res) => res.json())
          .then((data) => sendResponse({ online: true, port: 8000, data }))
          .catch((err) => sendResponse({ online: false, error: err.message }));
      });
    return true; // Keep message channel open for async response
  }
});
