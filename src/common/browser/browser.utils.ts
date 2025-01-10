import { Browser, BrowserContext, Page } from 'puppeteer';

class BrowserUtils {
  public async createNewPageWithProxy(
    browser: Browser,
    proxy: {
      ip: string;
      port: string;
      username: string;
      password: string;
    }
  ): Promise<{ context: BrowserContext; page: Page }> {
    const context = await browser.createBrowserContext({
      proxyServer: `http://${proxy.ip}:${proxy.port}`,
    });

    const page = await context.newPage();

    await page.authenticate({
      username: proxy.username,
      password: proxy.password,
    });

    return {
      context: context,
      page: page,
    };
  }
}

export default new BrowserUtils();
