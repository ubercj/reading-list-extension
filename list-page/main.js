const linksContainer = document.getElementById("links-container");
const refreshButton = document.getElementById("refresh");
const newLinkForm = document.getElementById("new-link-form");

/**
 * @typedef {object} ReadingListLink
 *
 * @prop {string} url
 * @prop {string} [id]
 * @prop {string} [title]
 */

/**
 * @type {ReadingListLink[]}
 */
let linksList;

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

  linksList = await bookmarkService.getReadingListLinks();
  buildReadingList();
  setUpListeners();

  // createErrorMessage("An error occurred fetching the reading list.");
}

async function refreshList() {
  const freshLinks = await bookmarkService.getReadingListLinks();
  setList(freshLinks);
}

function setUpListeners() {
  refreshButton.addEventListener("click", () => refreshList());

  newLinkForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newUrl = formData.get("new-link");
    addLink({ url: newUrl });
    event.target.reset();
  });
}

/**
 * @param {ReadingListLink[]} newList
 */
function setList(newList) {
  linksList = newList;
  buildReadingList();
}

/**
 * @param {ReadingListLink} newLink
 */
async function addLink(newLink) {
  linksList.push(newLink);
  buildReadingList();
  bookmarkService.createBookmark(newLink);
}

/**
 * @param {number} index
 */
function removeLink(index) {
  const linkToRemove = linksList.at(index);
  if (linkToRemove?.id) {
    bookmarkService.removeBookmark(linkToRemove);
  }
  linksList.splice(index, 1);

  buildReadingList();
}

/**
 * Constructs the list of links in the DOM
 */
function buildReadingList() {
  if (!linksList?.length) {
    Array.from(linksContainer.children).forEach((child) => child.remove());
    linksContainer.textContent = "Your reading list is empty";
    return;
  }

  const listEl = document.createElement("ul");
  listEl.classList.add("container");

  linksList.forEach((link, index) => {
    const listItemEl = document.createElement("li");
    const linkAnchor = document.createElement("a");

    linkAnchor.href = link.url;
    linkAnchor.textContent = link.title ?? link.url;

    const removeLinkButton = document.createElement("button");
    removeLinkButton.textContent = "Delete";
    removeLinkButton.onclick = () => removeLink(index);

    listItemEl.appendChild(linkAnchor);
    listItemEl.appendChild(removeLinkButton);
    listEl.appendChild(listItemEl);
  });

  linksContainer.textContent = "";
  linksContainer.appendChild(listEl);
}

document.addEventListener("DOMContentLoaded", setup);
