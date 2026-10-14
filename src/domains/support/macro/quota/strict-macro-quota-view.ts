import * as text from "../../../../kit/text.js";
import { StrictMacroQuota } from "./strict-macro-quota.js";

/** How screens and exports show a strict macro quota. */
export class StrictMacroQuotaView {
  codeText: string;
  label: string;
  graceDays: string;
  expiresAt: string;
  campaignRef: string;
  ceilingText: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    graceDays: string,
    expiresAt: string,
    campaignRef: string,
    ceilingText: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.ceilingText = ceilingText;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictMacroQuotaView(item: StrictMacroQuota): StrictMacroQuotaView {
  return new StrictMacroQuotaView(
    item.code,
    item.label,
    String(item.graceDays),
    String(item.expiresAt),
    text.truncate(item.campaignRef, 120),
    item.ceiling.toFixed(2),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictMacroQuotaViews(items: StrictMacroQuota[]): StrictMacroQuotaView[] {
  const views: StrictMacroQuotaView[] = [];
  for (const item of items) {
    views.push(toStrictMacroQuotaView(item));
  }
  return views;
}

export function sumStrictMacroQuotaView(view: StrictMacroQuotaView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedGraceDays + parsedExpiresAt + parsedCeiling;
}
