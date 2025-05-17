(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  console.log("content script is running");

  function logMessage(message) {
    console.log("content script received message: %j", message);
  }

  /**
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener(logMessage);
})();
