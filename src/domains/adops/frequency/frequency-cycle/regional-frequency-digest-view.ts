import * as text from "../../../../kit/text.js";
import { RegionalFrequencyDigest } from "./regional-frequency-digest.js";

/** How screens and exports show a regional frequency digest. */
export class RegionalFrequencyDigestView {
  codeText: string;
  name: string;
  windowDays: string;
  budgetText: string;
  openRate: string;
  campaignRefText: string;
  visible: string;
  segmentText: string;
  summaryText: string;
  bidText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    windowDays: string,
    budgetText: string,
    openRate: string,
    campaignRefText: string,
    visible: string,
    segmentText: string,
    summaryText: string,
    bidText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.windowDays = windowDays;
    this.budgetText = budgetText;
    this.openRate = openRate;
    this.campaignRefText = campaignRefText;
    this.visible = visible;
    this.segmentText = segmentText;
    this.summaryText = summaryText;
    this.bidText = bidText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalFrequencyDigestView(item: RegionalFrequencyDigest): RegionalFrequencyDigestView {
  return new RegionalFrequencyDigestView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    String(item.windowDays),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.campaignRef,
    `${item.visible}`,
    item.segment,
    item.summary,
    item.bid.toFixed(2),
    text.truncate(item.channel, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalFrequencyDigestViews(items: RegionalFrequencyDigest[]): RegionalFrequencyDigestView[] {
  const views: RegionalFrequencyDigestView[] = [];
  for (const item of items) {
    views.push(toRegionalFrequencyDigestView(item));
  }
  return views;
}

export function sumRegionalFrequencyDigestView(view: RegionalFrequencyDigestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedWindowDays + parsedBudget + parsedOpenRate;
}
