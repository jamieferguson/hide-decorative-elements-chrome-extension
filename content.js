(() => {
  console.log("Hide Aria-Hidden extension active.");

  let isHidden = false;

  function hideAllElements(parent) {
    try {
      const elementsToHide = parent.querySelectorAll(
        '[aria-hidden="true"], img[alt=""], audio[alt=""], video[alt=""], svg:not([aria-label]):not([aria-labelledby])'
      );
      elementsToHide.forEach((el) => {
        if (!el.hasAttribute("data-hidden-by-extension")) {
          el.setAttribute("data-original-display", el.style.display || "");
          el.style.display = "none";
          el.setAttribute("data-hidden-by-extension", "true");
        }
      });
    } catch (error) {
      console.error("Error hiding elements:", error);
    }
  }

  function showElements(parent) {
    try {
      const elementsToShow = parent.querySelectorAll(
        '[data-hidden-by-extension="true"]'
      );
      elementsToShow.forEach((el) => {
        el.style.display = el.getAttribute("data-original-display") || "";
        el.removeAttribute("data-hidden-by-extension");
        el.removeAttribute("data-original-display");
      });
    } catch (error) {
      console.error("Error showing elements:", error);
    }
  }

  // MutationObserver for dynamically added content
  const observer = new MutationObserver((mutations) => {
    if (isHidden) {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            hideAllElements(node);
          }
        });
      });
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    console.warn("Could not find document.body to observe.");
  }

  // Listen for toggle messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggle") {
      if (isHidden) {
        showElements(document.body);
        isHidden = false;
      } else {
        hideAllElements(document.body);
        isHidden = true;
      }
      sendResponse({ status: "toggled", isHidden });
    } else if (message.action === "getState") {
      sendResponse({ isHidden });
    }
  });
})();
