const linksContainer = document.getElementById("links-container");
const newLinkForm = document.getElementById("new-link-form");
const refreshButton = document.getElementById("refresh");

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

async function getReadingListFolder() {
  return browser.bookmarks.getTree().then((tree) => {
    const rootTree = tree[0];
    const otherBookmarksFolder = rootTree.children.find(
      (child) => child.title === "Other Bookmarks"
    );

    if (!otherBookmarksFolder) {
      sendMessage("Could not find expected root folder.");
      return;
    }

    const existingReadingListFolder = otherBookmarksFolder.children.find(
      (child) => child.title === "Reading List"
    );

    return existingReadingListFolder;
  });
}

/**
 * @returns {Promise<ReadingListLink[]>}
 */
async function getLinksFromFolder(folder) {
  return folder.children.map((child) => {
    return {
      url: child.url,
      title: child.title,
      id: child.id,
    };
  });
}

/**
 * @param {string} message
 */
function createErrorMessage(message) {
  linksContainer.innerHTML = message;
}

async function setup() {
  const readingListFolder = await getReadingListFolder();

  if (readingListFolder) {
    linksList = await getLinksFromFolder(readingListFolder);
    buildReadingList();
    setUpListeners();
  } else {
    createErrorMessage("An error occurred fetching the reading list.");
  }
}

async function refreshList() {
  const readingListFolder = await getReadingListFolder();

  if (readingListFolder) {
    const freshLinks = await getLinksFromFolder(readingListFolder);
    setList(freshLinks);
  }
}

function setUpListeners() {
  refreshButton.addEventListener("click", () => refreshList());

  newLinkForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newUrl = formData.get("new-link");
    addLink({ url: newUrl });
  });
}

/**
 * @param {ReadingListLink[]} newList
 */
function setList(newList) {
  linksList = newList;
  window.localStorage.setItem("links", JSON.stringify(linksList));

  buildReadingList();
}

/**
 * @param {ReadingListLink} newLink
 */
function addLink(newLink) {
  linksList.push(newLink);
  window.localStorage.setItem("links", JSON.stringify(linksList));

  buildReadingList();
}

/**
 * @param {number} index
 */
function removeLink(index) {
  const linkToRemove = linksList.at(index);

  if (linkToRemove.id) {
    browser.bookmarks.remove(linkToRemove.id);
  }

  linksList.splice(index, 1);
  window.localStorage.setItem("links", JSON.stringify(linksList));

  buildReadingList(linksList);
}

/**
 * Constructs the list of links in the DOM
 */
function buildReadingList() {
  if (!linksList?.length) {
    linksContainer.innerHTML = "Your reading list is empty";
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

  linksContainer.innerHTML = "";
  linksContainer.appendChild(listEl);
}

document.addEventListener("DOMContentLoaded", setup);