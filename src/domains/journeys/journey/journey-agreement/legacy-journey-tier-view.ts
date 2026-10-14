import * as text from "../../../../kit/text.js";
import { LegacyJourneyTier } from "./legacy-journey-tier.js";

/** How screens and exports show a legacy journey tier. */
export class LegacyJourneyTierView {
  codeText: string;
  label: string;
  maximum: string;
  rate: string;
  titleText: string;
  approved: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    maximum: string,
    rate: string,
    titleText: string,
    approved: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.maximum = maximum;
    this.rate = rate;
    this.titleText = titleText;
    this.approved = approved;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyJourneyTierView(item: LegacyJourneyTier): LegacyJourneyTierView {
  return new LegacyJourneyTierView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.title, 40),
    `${item.approved}`,
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyJourneyTierViews(items: LegacyJourneyTier[]): LegacyJourneyTierView[] {
  const views: LegacyJourneyTierView[] = [];
  for (const item of items) {
    views.push(toLegacyJourneyTierView(item));
  }
  return views;
}

export function sumLegacyJourneyTierView(view: LegacyJourneyTierView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedMaximum + parsedRate + parsedSendAt;
}
