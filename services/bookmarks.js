/**
 * @typedef {object} BookmarkService
 *
 * @prop {() => Promise<void>} setReadingListFolder
 * @prop {() => Promise<ReadingListLink[]>} getReadingListLinks
 * @prop {(url: string) => Promise<BookmarkTreeNode>} findBookmark
 * @prop {(link: ReadingListLink) => Promise<void>} createBookmark
 * @prop {(bookmark: BookmarkTreeNode) => Promise<void>} removeBookmark
 */

const ROOT_BOOKMARK_FOLDER_TITLE = "Other Bookmarks";
const READING_LIST_FOLDER_TITLE = "Reading List";
const SAVED_LINKS_FOLDER_TITLE = "Saved";

/**
 * @returns {BookmarkService}
 */
export function createBookmarkService() {
  /**
   * @type {BookmarkTreeNode | undefined}
   */
  let readingListFolder;

  async function setReadingListFolder() {
    readingListFolder = await findFolder(READING_LIST_FOLDER_TITLE);

    if (!readingListFolder) {
      console.log(
        "Could not find existing Reading List folder. Creating one now."
      );
      readingListFolder = await createFolder(READING_LIST_FOLDER_TITLE);
    }
  }

  /**
   * @returns {Promise<ReadingListLink[]>}
   */
  async function getReadingListLinks() {
    // Re-fetch the reading list folder to make sure we have the most current list of bookmarks
    await setReadingListFolder();

    return (
      readingListFolder?.children?.map((child) => {
        return {
          url: child.url,
          title: child.title,
          id: child.id,
        };
      }) ?? []
    );
  }

  /**
   * @param {string} url
   *
   * @returns {BookmarkTreeNode | undefined}
   */
  async function findBookmark(url) {
    const urlMatches = await browser.bookmarks.search({ url });

    return urlMatches.find(
      (bookmark) => bookmark.parentId === readingListFolder.id
    );
  }

  /**
   * @param {ReadingListLink} link
   */
  async function createBookmark({ title, url }) {
    browser.bookmarks.create({
      parentId: readingListFolder?.id,
      title,
      url,
    });
  }

  /**
   * @param {BookmarkTreeNode} bookmark
   */
  async function removeBookmark(bookmark) {
    browser.bookmarks.remove(bookmark.id);
  }

  return {
    setReadingListFolder,
    getReadingListLinks,
    findBookmark,
    createBookmark,
    removeBookmark,
  };
}

/**
 * @typedef {object} BookmarkTreeNode
 *
 * @prop {string} id
 * @prop {string} title
 * @prop {"bookmark" | "folder" | "separator"} type - Defaults to `"bookmark"` unless `url` is omitted, in which case it defaults to `"folder"`
 * @prop {string} [url]
 * @prop {string} [parentId]
 * @prop {BookmarkTreeNode[]} [children]
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode
 */

/**
 * @returns {Promise<BookmarkTreeNode>}
 */
async function getRootTree() {
  const rootTree = await browser.bookmarks.getTree();

  if (!rootTree[0]) {
    console.error("There was an issue accessing the bookmarks API.");
  }

  return rootTree[0];
}

/**
 * @param {BookmarkTreeNode} parent - A parent bookmark node whose children will be searched.
 * @param {string} title - The name of the bookmark node.
 *
 * @returns {BookmarkTreeNode | undefined}
 */
function findChildBookmarkNode(parent, title) {
  if (!parent.children) return undefined;

  return parent.children.find((child) => child.title === title);
}

/**
 * @param {string} folderName - The name of the folder being searched for.
 * @param {string} [parentFolderName] - The name of a parent folder to search within. If omitted, will search within the "Other Bookmarks" folder.
 *
 * @returns {Promise<BookmarkTreeNode | undefined>}
 */
async function findFolder(folderName, parentFolderName) {
  const rootTree = await getRootTree();
  const otherBookmarksFolder = findChildBookmarkNode(
    rootTree,
    ROOT_BOOKMARK_FOLDER_TITLE
  );

  if (!otherBookmarksFolder) {
    console.error("Could not find expected root folder.");
    return;
  }

  let parentFolder = otherBookmarksFolder;
  if (parentFolderName) {
    parentFolder =
      findChildBookmarkNode(otherBookmarksFolder, parentFolderName) ??
      otherBookmarksFolder;
  }

  const targetFolder = findChildBookmarkNode(parentFolder, folderName);

  return targetFolder;
}

/**
 * @param {string} title = The title of the folder to create.
 * @param {string} [parentId] - The ID of a folder in which to place the new folder as a subfolder. If omitted, the folder will be created within the "Other Bookmarks" folder (which is the browser default).
 *
 * @returns {Promise<BookmarkTreeNode>}
 */
async function createFolder(title, parentId) {
  /**
   * @type {BookmarkTreeNode}
   */
  const newFolder = {
    type: "folder",
    title,
    parentId,
  };

  return await browser.bookmarks.create(newFolder);
}