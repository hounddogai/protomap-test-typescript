import * as text from "../../../../kit/text.js";
import { TieredRetentionBudget } from "./tiered-retention-budget.js";

/** How screens and exports show a tiered retention budget. */
export class TieredRetentionBudgetView {
  code: string;
  label: string;
  channelText: string;
  discount: string;
  approvedText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channelText: string,
    discount: string,
    approvedText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channelText = channelText;
    this.discount = discount;
    this.approvedText = approvedText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRetentionBudgetView(item: TieredRetentionBudget): TieredRetentionBudgetView {
  return new TieredRetentionBudgetView(
    text.truncate(item.code, 64),
    item.label,
    item.channel,
    item.discount.toFixed(2),
    `${item.approved}`,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRetentionBudgetViews(items: TieredRetentionBudget[]): TieredRetentionBudgetView[] {
  const views: TieredRetentionBudgetView[] = [];
  for (const item of items) {
    views.push(toTieredRetentionBudgetView(item));
  }
  return views;
}

export function sumTieredRetentionBudgetView(view: TieredRetentionBudgetView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
