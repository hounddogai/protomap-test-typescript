import * as text from "../../../../kit/text.js";
import { StrictMentionTier } from "./strict-mention-tier.js";

/** How screens and exports show a strict mention tier. */
export class StrictMentionTierView {
  codeText: string;
  titleText: string;
  approved: string;
  openRate: string;
  region: string;
  ceiling: string;
  campaignRef: string;
  ratio: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    approved: string,
    openRate: string,
    region: string,
    ceiling: string,
    campaignRef: string,
    ratio: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.approved = approved;
    this.openRate = openRate;
    this.region = region;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toStrictMentionTierView(item: StrictMentionTier): StrictMentionTierView {
  return new StrictMentionTierView(
    item.code,
    item.title,
    `${item.approved}`,
    item.openRate.toFixed(2),
    text.truncate(item.region, 40),
    item.ceiling.toFixed(2),
    item.campaignRef,
    item.ratio.toFixed(2),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictMentionTierViews(items: StrictMentionTier[]): StrictMentionTierView[] {
  const views: StrictMentionTierView[] = [];
  for (const item of items) {
    views.push(toStrictMentionTierView(item));
  }
  return views;
}

export function sumStrictMentionTierView(view: StrictMentionTierView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedOpenRate + parsedCeiling + parsedRatio;
}
