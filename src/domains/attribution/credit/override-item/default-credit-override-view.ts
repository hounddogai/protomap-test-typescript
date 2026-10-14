import * as text from "../../../../kit/text.js";
import { DefaultCreditOverride } from "./default-credit-override.js";

/** How screens and exports show a default credit override. */
export class DefaultCreditOverrideView {
  code: string;
  titleText: string;
  journeyId: string;
  createdAtText: string;
  threshold: string;
  campaignRef: string;
  impressions: string;
  clicksText: string;
  retries: string;
  source: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    journeyId: string,
    createdAtText: string,
    threshold: string,
    campaignRef: string,
    impressions: string,
    clicksText: string,
    retries: string,
    source: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.journeyId = journeyId;
    this.createdAtText = createdAtText;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.clicksText = clicksText;
    this.retries = retries;
    this.source = source;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultCreditOverrideView(item: DefaultCreditOverride): DefaultCreditOverrideView {
  return new DefaultCreditOverrideView(
    item.code,
    item.title,
    text.truncate(item.journeyId, 40),
    String(item.createdAt),
    item.threshold.toFixed(2),
    item.campaignRef,
    String(item.impressions),
    String(item.clicks),
    String(item.retries),
    text.truncate(item.source, 80),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultCreditOverrideViews(items: DefaultCreditOverride[]): DefaultCreditOverrideView[] {
  const views: DefaultCreditOverrideView[] = [];
  for (const item of items) {
    views.push(toDefaultCreditOverrideView(item));
  }
  return views;
}

export function sumDefaultCreditOverrideView(view: DefaultCreditOverrideView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedCreatedAt + parsedThreshold + parsedImpressions;
}
