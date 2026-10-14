import * as text from "../../../../kit/text.js";
import { RedemptionQuota } from "./redemption-quota.js";

/** How screens and exports show a redemption quota. */
export class RedemptionQuotaView {
  code: string;
  title: string;
  priorityText: string;
  cost: string;
  externalRefText: string;
  ratio: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    priorityText: string,
    cost: string,
    externalRefText: string,
    ratio: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.priorityText = priorityText;
    this.cost = cost;
    this.externalRefText = externalRefText;
    this.ratio = ratio;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionQuotaView(item: RedemptionQuota): RedemptionQuotaView {
  return new RedemptionQuotaView(
    text.truncate(item.code, 64),
    item.title,
    String(item.priority),
    item.cost.toFixed(2),
    item.externalRef,
    item.ratio.toFixed(2),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionQuotaViews(items: RedemptionQuota[]): RedemptionQuotaView[] {
  const views: RedemptionQuotaView[] = [];
  for (const item of items) {
    views.push(toRedemptionQuotaView(item));
  }
  return views;
}

export function sumRedemptionQuotaView(view: RedemptionQuotaView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedPriority + parsedCost + parsedRatio;
}
