const linksContainer = document.getElementById("links-container");
const newLinkForm = document.getElementById("new-link-form");
const importForm = document.getElementById("import-form");

const exportActionsContainer = document.getElementById("export-actions");
const exportButton = document.getElementById("export-button");

/**
 * @type {string[]}
 */
let linksList = getLinksFromStorage();

function getLinksFromStorage() {
  const rawLinks = window.localStorage.getItem("links");
  return rawLinks ? JSON.parse(rawLinks) : [];
}

function setup() {
  buildReadingList(linksList);
  setUpListeners();
}

function setUpListeners() {
  newLinkForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newUrl = formData.get("new-link");
    addLink(newUrl);
    console.log("Added " + newUrl + " to reading list.");
  });

  exportButton.addEventListener("click", (_event) => {
    exportReadingList();
  });

  importForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newListFile = formData.get("list-import");

    if (newListFile) {
      importReadingList(newListFile);
    } else {
      console.error("No upload file could be found.");
    }
  });
}

function setList(newList) {
  linksList = newList;
  window.localStorage.setItem("links", JSON.stringify(linksList));

  buildReadingList(linksList);
}

function addLink(newLink) {
  linksList.push(newLink);
  window.localStorage.setItem("links", JSON.stringify(linksList));

  buildReadingList(linksList);
}

function removeLink(index) {
  linksList.splice(index, 1);
  window.localStorage.setItem("links", JSON.stringify(linksList));

  buildReadingList(linksList);
}

function buildReadingList(list) {
  if (!list?.length) {
    linksContainer.innerHTML = "Your reading list is empty";
    return;
  }

  const listEl = document.createElement("ul");
  listEl.classList.add("container");

  list.forEach((link, index) => {
    const listItemEl = document.createElement("li");
    const linkAnchor = document.createElement("a");

    linkAnchor.href = link;
    linkAnchor.textContent = link;

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

function exportReadingList() {
  const blob = new Blob([JSON.stringify(linksList)], {
    type: "application/json",
  });
  const downloadUrl = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString();
  const downloadFilename = `reading-list_${timestamp}.json`;

  const downloadAnchor = document.createElement("a");
  downloadAnchor.textContent = "Download";
  downloadAnchor.href = downloadUrl;
  downloadAnchor.setAttribute("download", downloadFilename);

  exportActionsContainer.appendChild(downloadAnchor);
}

async function importReadingList(file) {
  const importedList = await new Response(file).json();
  setList(importedList);
}
