import * as text from "../../../../kit/text.js";
import { LegacyCsatQuota } from "./legacy-csat-quota.js";

/** How screens and exports show a legacy csat quota. */
export class LegacyCsatQuotaView {
  code: string;
  label: string;
  sendAt: string;
  name: string;
  attempts: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAt: string,
    name: string,
    attempts: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.name = name;
    this.attempts = attempts;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCsatQuotaView(item: LegacyCsatQuota): LegacyCsatQuotaView {
  return new LegacyCsatQuotaView(
    item.code,
    text.truncate(item.label, 80),
    String(item.sendAt),
    item.name,
    String(item.attempts),
    text.truncate(item.campaignRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCsatQuotaViews(items: LegacyCsatQuota[]): LegacyCsatQuotaView[] {
  const views: LegacyCsatQuotaView[] = [];
  for (const item of items) {
    views.push(toLegacyCsatQuotaView(item));
  }
  return views;
}

export function sumLegacyCsatQuotaView(view: LegacyCsatQuotaView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedSendAt + parsedAttempts;
}
