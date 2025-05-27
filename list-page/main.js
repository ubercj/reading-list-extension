const linksContainer = document.getElementById("links-container");
const savedLinksContainer = document.getElementById("saved-links-container");
const refreshButton = document.getElementById("refresh");
const newLinkForm = document.getElementById("new-link-form");

/**
 * @typedef {object} ReadingListLink
 *
 * @prop {string} title
 * @prop {string} url
 * @prop {string} [id]
 */

/**
 * @type {ReadingListLink[]}
 */
let readingListLinks;

/**
 * @type {ReadingListLink[]}
 */
let savedLinks;

/**
 * @type {import("../services/bookmarks").BookmarkService}
 */
let bookmarkService;

/**
 * @param {string} message
 */
function createErrorMessage(message) {
  linksContainer.textContent = message;
}

async function setup() {
  const { createBookmarkService } = await import(
    browser.runtime.getURL("services/bookmarks.js")
  );
  bookmarkService = createBookmarkService();
  refreshList();

  setUpListeners();
}

async function refreshList() {
  readingListLinks = await bookmarkService.getReadingListLinks();
  savedLinks = await bookmarkService.getSavedLinks();
  buildReadingList();
  buildSavedList();
}

function setUpListeners() {
  refreshButton.addEventListener("click", () => refreshList());

  newLinkForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newUrl = formData.get("new-link");
    addLink({ title: newUrl, url: newUrl });
    event.target.reset();
  });
}

/**
 * @param {ReadingListLink} newLink
 */
async function addLink(newLink) {
  readingListLinks.push(newLink);
  bookmarkService.createBookmark(newLink);
  buildReadingList();
}

/**
 * @param {number} index
 */
async function saveLink(index) {
  const linkToSave = readingListLinks.at(index);
  savedLinks.push(linkToSave);
  readingListLinks.splice(index, 1);
  buildReadingList();
  buildSavedList();
  bookmarkService.saveLink(linkToSave);
}

/**
 * @param {number} index
 */
function removeLink(index) {
  const linkToRemove = readingListLinks.at(index);
  if (linkToRemove?.id) {
    bookmarkService.removeBookmark(linkToRemove);
  }
  readingListLinks.splice(index, 1);

  buildReadingList();
}

/**
 * @param {number} index
 */
async function removeSavedLink(index) {
  const linkToRemove = savedLinks.at(index);
  if (linkToRemove?.id) {
    bookmarkService.removeBookmark(linkToRemove);
  }
  savedLinks.splice(index, 1);

  buildSavedList();
}

/**
 * Constructs the list of links in the DOM
 */
function buildReadingList() {
  Array.from(linksContainer.children).forEach((child) => child.remove());

  if (!readingListLinks?.length) {
    linksContainer.textContent = "Your reading list is empty.";
    return;
  }

  const listEl = document.createElement("ul");
  listEl.classList.add("container");

  readingListLinks.forEach((link, index) => {
    const listItemEl = document.createElement("li");
    const linkAnchor = document.createElement("a");

    linkAnchor.href = link.url;
    linkAnchor.textContent = link.title;

    const saveLinkButton = document.createElement("button");
    saveLinkButton.textContent = "Save";
    saveLinkButton.onclick = () => saveLink(index);

    const removeLinkButton = document.createElement("button");
    removeLinkButton.textContent = "Delete";
    removeLinkButton.onclick = () => removeLink(index);

    listItemEl.appendChild(linkAnchor);
    listItemEl.appendChild(saveLinkButton);
    listItemEl.appendChild(removeLinkButton);
    listEl.appendChild(listItemEl);
  });

  linksContainer.textContent = "";
  linksContainer.appendChild(listEl);
}

function buildSavedList() {
  Array.from(savedLinksContainer.children).forEach((child) => child.remove());

  if (!savedLinks?.length) {
    savedLinksContainer.textContent = "You haven't saved anything.";
    return;
  }

  const listEl = document.createElement("ul");
  listEl.classList.add("container");

  savedLinks.forEach((link, index) => {
    const listItemEl = document.createElement("li");
    const linkAnchor = document.createElement("a");

    linkAnchor.href = link.url;
    linkAnchor.textContent = link.title;

    const removeLinkButton = document.createElement("button");
    removeLinkButton.textContent = "Delete";
    removeLinkButton.onclick = () => removeSavedLink(index);

    listItemEl.appendChild(linkAnchor);
    listItemEl.appendChild(removeLinkButton);
    listEl.appendChild(listItemEl);
  });

  savedLinksContainer.textContent = "";
  savedLinksContainer.appendChild(listEl);
}

document.addEventListener("DOMContentLoaded", setup);
