// Grab element references
const readingListToggleButton = document.getElementById(
  "reading-list-toggle-button"
);
const buttonTextSpan = readingListToggleButton.querySelector("span");
const buttonIcon = document.getElementById("button-icon");
const openReadingListButton = document.getElementById(
  "open-reading-list-button"
);

/**
 * @type {import("../services/bookmarks").BookmarkService}
 */
let bookmarkService;

/**
 * @type {Tab | undefined}
 */
let currentTab;

/**
 * @type {import("../services/bookmarks").BookmarkTreeNode | undefined}
 */
let currentBookmark;

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/reading-list-content-script.js" })
  .then(setup);

/*
 * Updates the button text and icon based on whether the current page has already been added to the reading list
 */
function updateButton() {
  const buttonText = currentBookmark
    ? "Remove from reading list"
    : "Add to reading list";
  buttonTextSpan.textContent = buttonText;

  const iconImage = currentBookmark
    ? browser.runtime.getURL("icons/remove-bookmark-icon_24.png")
    : browser.runtime.getURL("icons/add-bookmark-icon_24.png");
  buttonIcon.src = iconImage;
}

/*
 * Add or remove the bookmark on the current page.
 */
function toggleBookmark() {
  if (currentBookmark?.id) {
    bookmarkService.removeBookmark(currentBookmark);
  } else {
    bookmarkService.createBookmark(currentTab);
  }
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
async function updateAddonStateForActiveTab() {
  if (!bookmarkService) {
    console.warn("Bookmark Service could not be found.");
    return;
  }

  function isSupportedProtocol(urlString) {
    let supportedProtocols = ["https:", "http:", "ftp:", "file:"];
    let url = document.createElement("a");
    url.href = urlString;
    return supportedProtocols.indexOf(url.protocol) != -1;
  }

  async function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      if (isSupportedProtocol(currentTab.url)) {
        currentBookmark = await bookmarkService.findBookmark(currentTab.url);
        updateButton();
      } else {
        console.log(`The '${currentTab.url}' URL is not supported.`);
      }
    }
  }

  const tabQuery = await getCurrentTab();
  updateTab(tabQuery);
}

async function getCurrentTab() {
  return browser.tabs.query({ active: true, currentWindow: true });
}

// Set up services and listeners

async function setUpServices() {
  const { createBookmarkService } = await import(
    browser.runtime.getURL("services/bookmarks.js")
  );
  bookmarkService = createBookmarkService();
}

function setUpListeners() {
  readingListToggleButton.addEventListener("click", (_event) => {
    toggleBookmark();
  });

  openReadingListButton.addEventListener("click", (_event) => {
    browser.tabs.create({
      url: "/list-page/index.html",
    });
  });
}

async function setup() {
  try {
    await setUpServices();
    await Promise.allSettled([
      bookmarkService.setReadingListFolder(),
      bookmarkService.setSavedLinksFolder(),
    ]);
    setUpListeners();

    // update when the extension loads initially
    updateAddonStateForActiveTab();
  } catch (error) {
    reportExecuteScriptError(error);
  }
}

/**
 * There was an error executing the setup script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(
    `Failed to execute reading list content script: ${error.message}`
  );
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

function sendMessage(message) {
  browser.tabs.sendMessage(currentTab.id, {
    currentTab,
    message,
  });
}

/**
 * @typedef {object} Tab
 *
 * @prop {boolean} active
 * @prop {integer} [id]
 * @prop {string} [title]
 * @prop {string} [url]
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
 */
