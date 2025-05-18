/**
 * @typedef {object} BookmarkService
 *
 * @prop {() => Promise<void>} getReadingListFolder
 * @prop {() => Promise<void>} createReadingListFolder
 * @prop {() => Promise<ReadingListLink[]>} getReadingListLinks
 * @prop {(url: string) => Promise<BookmarkTreeNode>} findBookmark
 * @prop {(link: ReadingListLink) => Promise<void>} createBookmark
 * @prop {(bookmark: BookmarkTreeNode) => Promise<void>} removeBookmark
 */

/**
 * @returns {BookmarkService}
 */
export function createBookmarkService() {
  /**
   * @type {BookmarkTreeNode | undefined}
   */
  let readingListFolder;

  async function getReadingListFolder() {
    return browser.bookmarks.getTree().then((tree) => {
      const rootTree = tree[0];
      const otherBookmarksFolder = rootTree.children.find(
        (child) => child.title === "Other Bookmarks"
      );

      if (!otherBookmarksFolder) {
        console.warn("Could not find expected root folder.");
        return;
      }

      const existingReadingListFolder = otherBookmarksFolder.children.find(
        (child) => child.title === "Reading List"
      );

      readingListFolder = existingReadingListFolder;
    });
  }

  async function createReadingListFolder() {
    readingListFolder = await browser.bookmarks.create({
      type: "folder",
      title: "Reading List",
    });
  }

  /**
   * @returns {Promise<ReadingListLink[]>}
   */
  async function getReadingListLinks() {
    await getReadingListFolder();

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
    getReadingListFolder,
    createReadingListFolder,
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
