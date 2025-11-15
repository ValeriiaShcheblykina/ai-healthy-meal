import type { Page } from '@playwright/test';

/**
 * Helper function to wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 5000
) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      const pattern = typeof urlPattern === 'string' ? urlPattern : urlPattern;
      return typeof pattern === 'string'
        ? url.includes(pattern)
        : pattern.test(url);
    },
    { timeout }
  );
}

/**
 * Helper function to clear local storage
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Helper function to clear session storage
 */
export async function clearSessionStorage(page: Page) {
  await page.evaluate(() => sessionStorage.clear());
}

/**
 * Helper function to clear all storage
 */
export async function clearAllStorage(page: Page) {
  await clearLocalStorage(page);
  await clearSessionStorage(page);
  await page.context().clearCookies();
}

/**
 * Helper function to set local storage item
 */
export async function setLocalStorageItem(
  page: Page,
  key: string,
  value: string
) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key,
    value,
  });
}

/**
 * Helper function to get local storage item
 */
export async function getLocalStorageItem(
  page: Page,
  key: string
): Promise<string | null> {
  return await page.evaluate((key) => localStorage.getItem(key), key);
}
