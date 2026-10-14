import * as text from "../../../../kit/text.js";
import { ScheduledActivationDigest } from "./scheduled-activation-digest.js";

/** How screens and exports show a scheduled activation digest. */
export class ScheduledActivationDigestView {
  codeText: string;
  name: string;
  campaignRef: string;
  impressionsText: string;
  variant: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    campaignRef: string,
    impressionsText: string,
    variant: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.campaignRef = campaignRef;
    this.impressionsText = impressionsText;
    this.variant = variant;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledActivationDigestView(item: ScheduledActivationDigest): ScheduledActivationDigestView {
  return new ScheduledActivationDigestView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.campaignRef, 40),
    String(item.impressions),
    text.truncate(item.variant, 80),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledActivationDigestViews(items: ScheduledActivationDigest[]): ScheduledActivationDigestView[] {
  const views: ScheduledActivationDigestView[] = [];
  for (const item of items) {
    views.push(toScheduledActivationDigestView(item));
  }
  return views;
}

export function sumScheduledActivationDigestView(view: ScheduledActivationDigestView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedImpressions + parsedRate;
}
