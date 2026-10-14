import * as text from "../../../../kit/text.js";
import { SuppressionQuota } from "./suppression-quota.js";

/** How screens and exports show a suppression quota. */
export class SuppressionQuotaView {
  code: string;
  labelText: string;
  cost: string;
  expiresAt: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cost: string,
    expiresAt: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionQuotaView(item: SuppressionQuota): SuppressionQuotaView {
  return new SuppressionQuotaView(
    item.code,
    text.truncate(item.label, 64),
    item.cost.toFixed(2),
    String(item.expiresAt),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionQuotaViews(items: SuppressionQuota[]): SuppressionQuotaView[] {
  const views: SuppressionQuotaView[] = [];
  for (const item of items) {
    views.push(toSuppressionQuotaView(item));
  }
  return views;
}

export function sumSuppressionQuotaView(view: SuppressionQuotaView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCost + parsedExpiresAt;
}
