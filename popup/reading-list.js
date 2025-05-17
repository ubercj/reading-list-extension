/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
const readingListToggleButton = document.getElementById(
  "reading-list-toggle-button"
);
const buttonTextSpan = readingListToggleButton.querySelector("span");
const buttonIcon = document.getElementById("button-icon");

function listenForClicks() {
  console.log("listenForClicks");
  readingListToggleButton.addEventListener("click", (event) => {
    console.log("button clicked");
    toggleBookmark();
  });
}

/**
 * Just log the error to the console.
 */
function reportError(error) {
  console.error(`Could not add to reading list: ${error}`);
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(
    `Failed to execute reading list content script: ${error.message}`
  );
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/reading-list-content-script.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);

/**
 * OG script
 */

let currentTab;
let currentBookmark;

/*
 * Updates the button text and icon based on whether the current page has already been added to the reading list
 */
function updateIcon() {
  const buttonText = currentBookmark
    ? "Remove from reading list"
    : "Add to reading list";
  buttonTextSpan.textContent = buttonText;

  const iconImage = currentBookmark
    ? browser.runtime.getURL("icons/star-empty-19.png")
    : browser.runtime.getURL("icons/star-filled-19.png");
  buttonIcon.src = iconImage;
}

function createReadingListFolder() {
  browser.bookmarks.create({ type: "folder", title: "Reading List" });
}

/*
 * Add or remove the bookmark on the current page.
 */
function toggleBookmark() {
  console.log("Current Tab: %j", currentTab);
  if (currentBookmark) {
    browser.bookmarks.remove(currentBookmark.id);
  } else {
    browser.bookmarks.create({ title: currentTab.title, url: currentTab.url });
  }
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateAddonStateForActiveTab(tabs) {
  function isSupportedProtocol(urlString) {
    let supportedProtocols = ["https:", "http:", "ftp:", "file:"];
    let url = document.createElement("a");
    url.href = urlString;
    return supportedProtocols.indexOf(url.protocol) != -1;
  }

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      if (isSupportedProtocol(currentTab.url)) {
        let searching = browser.bookmarks.search({ url: currentTab.url });
        searching.then((bookmarks) => {
          currentBookmark = bookmarks[0];
          updateIcon();
        });
      } else {
        console.log(
          `Bookmark it! does not support the '${currentTab.url}' URL.`
        );
      }
    }
  }

  let gettingActiveTab = browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  gettingActiveTab.then(updateTab);
}

// listen for bookmarks being created
browser.bookmarks.onCreated.addListener(updateAddonStateForActiveTab);

// listen for bookmarks being removed
browser.bookmarks.onRemoved.addListener(updateAddonStateForActiveTab);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateAddonStateForActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateAddonStateForActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateAddonStateForActiveTab);

// update when the extension loads initially
updateAddonStateForActiveTab();
