import * as text from "../../../../kit/text.js";
import { LegacyInviteBatch } from "./legacy-invite-batch.js";

/** How screens and exports show a legacy invite batch. */
export class LegacyInviteBatchView {
  code: string;
  nameText: string;
  archived: string;
  region: string;
  conversionRate: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    archived: string,
    region: string,
    conversionRate: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.archived = archived;
    this.region = region;
    this.conversionRate = conversionRate;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyInviteBatchView(item: LegacyInviteBatch): LegacyInviteBatchView {
  return new LegacyInviteBatchView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 80),
    `${item.archived}`,
    item.region,
    item.conversionRate.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyInviteBatchViews(items: LegacyInviteBatch[]): LegacyInviteBatchView[] {
  const views: LegacyInviteBatchView[] = [];
  for (const item of items) {
    views.push(toLegacyInviteBatchView(item));
  }
  return views;
}

export function sumLegacyInviteBatchView(view: LegacyInviteBatchView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedConversionRate + parsedClicks;
}
