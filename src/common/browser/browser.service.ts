import { Injectable, Logger } from '@nestjs/common';
import { firefox } from 'playwright-extra';
import { BrowserInstance } from './types/browser.types';
import { ConfigService } from '@nestjs/config';
import { Browser } from 'playwright';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);

  constructor(private readonly configService: ConfigService<unknown, true>) {}

  public async closeAllPages(browser: Browser) {
    try {
      await Promise.allSettled(
        browser
          .contexts()
          .map((context) => [
            context.close(),
            context.pages().map((page) => page.close()),
          ])
          .flat(),
      );

      await browser?.close();
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  // ! isPrivateBrowser делает браузер приватным, он не позволяет доставать куки be careful
  public async getBrowser(
    {
      headless,
      executablePath,
      isPrivateBrowser = false,
    }: {
      headless: boolean;
      executablePath?: string;
      isPrivateBrowser?: boolean;
    },
    useProxy = true,
  ): Promise<BrowserInstance | null> {
    try {
      const proxy = {
        ip: '122.8.65.2',
        port: '6668',
        username: 'WxB2qwfztbaDfKv1',
        password: 'anything',
      };

      const browser = await firefox.launch({
        headless,
        executablePath,
        proxy: proxy
          ? {
              server: `http://${proxy.ip}:${proxy.port}`,
              username: proxy.username,
              password: proxy.password,
            }
          : undefined,
        firefoxUserPrefs: {
          'browser.cache.jsbc_compression_level': 3,
          'media.memory_cache_max_size': 65536,
          'media.cache_readahead_limit': 7200,
          'media.cache_resume_threshold': 3600,
          'image.mem.decode_bytes_at_a_time': 32768,
          'network.http.max-connections': 1800,
          'network.http.max-persistent-connections-per-server': 10,
          'network.http.max-urgent-start-excessive-connections-per-host': 5,
          'network.http.pacing.requests.enabled': false,
          'network.dnsCacheExpiration': 3600,
          'network.ssl_tokens_cache_capacity': 10240,
          'network.dns.disablePrefetch': true,
          'network.dns.disablePrefetchFromHTTPS': true,
          'network.prefetch-next': false,
          'network.predictor.enabled': false,
          'layout.css.grid-template-masonry-value.enabled': true,
          'dom.enable_web_task_scheduling': true,
          'dom.security.sanitizer.enabled': true,
          'media.webspeech.synth.enabled': false,
          'media.webspeech.recognition.enable': false,
          ...(isPrivateBrowser && {
            'browser.privatebrowsing.autostart': true,
          }),
        },
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        javaScriptEnabled: true,
        bypassCSP: true, // Bypass Content-Security-Policy
      });

      const page = await context.newPage();

      return {
        browser,
        context,
        page,
      };
    } catch (error) {
      console.log(error);
      this.logger.log(
        `An error occurred while creating the browser instance ${error}`,
      );
      return null;
    }
  }
}
