import * as text from "../../../../kit/text.js";
import { TierAudit } from "./tier-audit.js";

/** How screens and exports show a tier audit. */
export class TierAuditView {
  code: string;
  title: string;
  ratio: string;
  graceDays: string;
  active: string;
  openRateText: string;
  regionText: string;
  descriptionText: string;
  phoneText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    ratio: string,
    graceDays: string,
    active: string,
    openRateText: string,
    regionText: string,
    descriptionText: string,
    phoneText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.active = active;
    this.openRateText = openRateText;
    this.regionText = regionText;
    this.descriptionText = descriptionText;
    this.phoneText = phoneText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toTierAuditView(item: TierAudit): TierAuditView {
  return new TierAuditView(
    item.code,
    text.truncate(item.title, 120),
    item.ratio.toFixed(2),
    String(item.graceDays),
    `${item.active}`,
    item.openRate.toFixed(2),
    item.region,
    item.description,
    text.truncate(item.phone, 80),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierAuditViews(items: TierAudit[]): TierAuditView[] {
  const views: TierAuditView[] = [];
  for (const item of items) {
    views.push(toTierAuditView(item));
  }
  return views;
}

export function sumTierAuditView(view: TierAuditView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedRatio + parsedGraceDays + parsedOpenRate;
}
