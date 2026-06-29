import { logger } from '../utils/logger';
import { browserManager } from '../core/scraper-engine/browser-manager';

export interface GoogleMapsDetailData {
  companyName: string;
  website?: string;
  phone?: string;
  phones?: string[];
  email?: string;
  address?: string;
  streetAddress?: string;
  postalCode?: string;
  pincode?: string;
  category?: string;
  secondaryCategories?: string[];
  rating?: number;
  reviewsCount?: number;
  totalPhotos?: number;
  workingHours?: string;
  businessStatus?: string;
  serviceOptions?: string[];
  ownerClaimed?: boolean;
  plusCode?: string;
  placeId?: string;
  sourceUrl?: string;
  latitude?: number;
  longitude?: number;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    twitter?: string;
    whatsapp?: string;
  };
  extractedAt: string;
}

export class GoogleMapsDetailExtractor {
  private readonly NAV_TIMEOUT = 30000;
  private readonly DETAIL_LOAD_TIMEOUT = 15000;

  async extractDetail(placeId: string, sourceUrl?: string): Promise<GoogleMapsDetailData | null> {
    const url = sourceUrl || this.buildPlaceUrl(placeId);
    if (!url) return null;

    let page: any = null;
    try {
      const acquired = await browserManager.acquire('gm-detail');
      page = acquired.page;

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.NAV_TIMEOUT,
      });

      await page.waitForTimeout(3000);

      const panelLoaded = await this.waitForDetailPanel(page);
      if (!panelLoaded) {
        logger.warn({ placeId, url }, 'GoogleMapsDetail: Detail panel did not load');
        return null;
      }

      await page.waitForTimeout(1500);

      const data = await this.extractAllFields(page, placeId);
      data.extractedAt = new Date().toISOString();
      return data;
    } catch (err) {
      logger.error({ placeId, url, err: err instanceof Error ? err.message : String(err) }, 'GoogleMapsDetail: Extraction failed');
      return null;
    } finally {
      if (page) {
        await browserManager.release(page, 'gm-detail').catch(() => {});
      }
    }
  }

  private buildPlaceUrl(placeId: string): string {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
  }

  private async waitForDetailPanel(page: any): Promise<boolean> {
    try {
      await page.waitForSelector('div[role="main"]', { timeout: this.DETAIL_LOAD_TIMEOUT });
      return true;
    } catch {
      try {
        await page.waitForSelector('h1', { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  private async extractAllFields(page: any, placeId: string): Promise<GoogleMapsDetailData> {
    const data: GoogleMapsDetailData = {
      companyName: '',
      placeId,
      extractedAt: '',
    };

    try {
      data.companyName = await this.extractText(page, 'h1') || '';
    } catch { }

    try {
      data.rating = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/([\d.]+)\s*\([\d,]+/);
        if (match) return parseFloat(match[1]);
        const ariaLabel = document.querySelector('[aria-label*="stars"]')?.getAttribute('aria-label');
        if (ariaLabel) {
          const m = ariaLabel.match(/[\d.]+/);
          if (m) return parseFloat(m[0]);
        }
        return undefined;
      });
    } catch { }

    try {
      data.reviewsCount = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/([\d,]+)\s*reviews?/i);
        if (match) return parseInt(match[1].replace(/,/g, ''), 10);
        return undefined;
      });
    } catch { }

    try {
      data.website = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        for (const link of links) {
          const href = (link as HTMLAnchorElement).href || '';
          if (href && /^https?:\/\//.test(href) && !href.includes('google.com/maps')) {
            return href;
          }
        }
        return undefined;
      });
    } catch { }

    try {
      data.phone = await page.evaluate(() => {
        const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
        if (telLinks.length > 0) {
          const href = (telLinks[0] as HTMLAnchorElement).href;
          return decodeURIComponent(href.replace('tel:', ''));
        }
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          const tooltip = btn.getAttribute('data-tooltip') || '';
          const phoneMatch = tooltip.match(/[\+\d\s\-\(\)]{7,}/);
          if (phoneMatch) return phoneMatch[0].trim();
        }
        return undefined;
      });
    } catch { }

    try {
      data.address = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="maps.google.com"]'));
        for (const link of links) {
          const text = (link as HTMLElement).innerText?.trim();
          if (text && text.length > 10) return text;
        }
        const buttons = Array.from(document.querySelectorAll('button[data-tooltip]'));
        for (const btn of buttons) {
          const tooltip = btn.getAttribute('data-tooltip') || '';
          if (tooltip && tooltip.length > 15 && !tooltip.includes('phone') && !tooltip.includes('website')) {
            return tooltip;
          }
        }
        return undefined;
      });
    } catch { }

    try {
      data.category = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/maps/search/"]'));
        for (const link of links) {
          const text = (link as HTMLElement).innerText?.trim();
          if (text && text.length > 2 && text.length < 60) return text;
        }
        return undefined;
      });
    } catch { }

    try {
      data.businessStatus = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        for (const span of spans) {
          const text = (span as HTMLElement).innerText?.trim().toLowerCase();
          if (text === 'open' || text?.includes('temporarily closed') || text?.includes('permanently closed')) {
            return (span as HTMLElement).innerText?.trim();
          }
        }
        return undefined;
      });
    } catch { }

    try {
      data.workingHours = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        for (const table of tables) {
          const rows = table.querySelectorAll('tr');
          const hours: string[] = [];
          for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 2) {
              const day = cells[0].innerText?.trim();
              const time = cells[1].innerText?.trim();
              if (day && time && day.length < 10) {
                hours.push(`${day}: ${time}`);
              }
            }
          }
          if (hours.length > 0) return hours.join('\n');
        }
        return undefined;
      });
    } catch { }

    try {
      data.plusCode = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/([A-Z0-9]{4}\+[A-Z0-9]{2,4})/);
        return match ? match[1] : undefined;
      });
    } catch { }

    try {
      const coords = await page.evaluate(() => {
        const url = window.location.href;
        const match = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
        if (match) {
          return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }
        return null;
      });
      if (coords) {
        data.latitude = coords.lat;
        data.longitude = coords.lng;
      }
    } catch { }

    try {
      data.totalPhotos = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/([\d,]+)\s*photos?/i);
        if (match) return parseInt(match[1].replace(/,/g, ''), 10);
        return undefined;
      });
    } catch { }

    try {
      data.ownerClaimed = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Claim this business') ? false : text.includes('Own this business') ? true : undefined;
      });
    } catch { }

    try {
      data.serviceOptions = await page.evaluate(() => {
        const options: string[] = [];
        const knownOptions = ['online appointments', 'online estimates', 'in-store shopping', 'delivery', 'takeout', 'dine-in', 'curbside pickup', 'no-contact delivery'];
        const spans = Array.from(document.querySelectorAll('span'));
        for (const span of spans) {
          const text = (span as HTMLElement).innerText?.trim().toLowerCase();
          if (text && knownOptions.includes(text)) {
            options.push((span as HTMLElement).innerText?.trim() || text);
          }
        }
        return options.length > 0 ? options : undefined;
      });
    } catch { }

    try {
      data.sourceUrl = await page.evaluate(() => window.location.href);
    } catch { }

    return data;
  }

  private async extractText(page: any, selector: string): Promise<string | undefined> {
    try {
      return await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        return el ? (el as HTMLElement).innerText?.trim() || undefined : undefined;
      }, selector);
    } catch {
      return undefined;
    }
  }
}
