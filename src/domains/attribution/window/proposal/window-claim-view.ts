import * as text from "../../../../kit/text.js";
import { WindowClaim } from "./window-claim.js";

/** How screens and exports show a window claim. */
export class WindowClaimView {
  code: string;
  titleText: string;
  clicks: string;
  threshold: string;
  externalRefText: string;
  summary: string;
  country: string;
  minimumText: string;
  locale: string;
  expiresAt: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    clicks: string,
    threshold: string,
    externalRefText: string,
    summary: string,
    country: string,
    minimumText: string,
    locale: string,
    expiresAt: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.clicks = clicks;
    this.threshold = threshold;
    this.externalRefText = externalRefText;
    this.summary = summary;
    this.country = country;
    this.minimumText = minimumText;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toWindowClaimView(item: WindowClaim): WindowClaimView {
  return new WindowClaimView(
    item.code,
    item.title,
    String(item.clicks),
    item.threshold.toFixed(2),
    item.externalRef,
    item.summary,
    item.country,
    item.minimum.toFixed(2),
    text.truncate(item.locale, 40),
    String(item.expiresAt),
    text.truncate(item.channel, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowClaimViews(items: WindowClaim[]): WindowClaimView[] {
  const views: WindowClaimView[] = [];
  for (const item of items) {
    views.push(toWindowClaimView(item));
  }
  return views;
}

export function sumWindowClaimView(view: WindowClaimView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedClicks + parsedThreshold + parsedMinimum;
}
