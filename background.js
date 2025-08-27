const iconInactive = {
  16: "icons/icon.png",
  32: "icons/icon.png",
  48: "icons/icon.png",
  128: "icons/icon.png",
};

const iconActive = {
  16: "icons/icon-active.png",
  32: "icons/icon-active.png",
  48: "icons/icon-active.png",
  128: "icons/icon-active.png",
};

// Track active state per tab ID
const activeTabs = new Map();

async function injectAndToggle(tabId) {
  try {
    // Inject content.js if not already injected
    if (!activeTabs.has(tabId)) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
    }

    // Send toggle message
    chrome.tabs.sendMessage(tabId, { action: "toggle" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("No response from content script, reinjecting...");
        activeTabs.delete(tabId);
        setTimeout(() => injectAndToggle(tabId), 100);
      } else {
        const isHidden = response?.isHidden ?? false;
        activeTabs.set(tabId, isHidden);
        updateIcon(tabId, isHidden);
      }
    });
  } catch (error) {
    console.error("Injection or toggle failed:", error);
  }
}

function updateIcon(tabId, isActive) {
  chrome.action.setIcon({
    tabId,
    path: isActive ? iconActive : iconInactive,
  });
}

// Button click
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  injectAndToggle(tab.id);
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

// Reset state on navigation, then query real state if possible
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    // After reload, ask content script if it's active
    chrome.tabs.sendMessage(tabId, { action: "getState" }, (response) => {
      if (chrome.runtime.lastError) {
        activeTabs.delete(tabId);
        updateIcon(tabId, false);
      } else {
        const isHidden = response?.isHidden ?? false;
        activeTabs.set(tabId, isHidden);
        updateIcon(tabId, isHidden);
      }
    });
  }
});
