import * as text from "../../../../kit/text.js";
import { GlobalRewardBaseline } from "./global-reward-baseline.js";

/** How screens and exports show a global reward baseline. */
export class GlobalRewardBaselineView {
  codeText: string;
  title: string;
  checksum: string;
  sourceText: string;
  name: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    checksum: string,
    sourceText: string,
    name: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.checksum = checksum;
    this.sourceText = sourceText;
    this.name = name;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRewardBaselineView(item: GlobalRewardBaseline): GlobalRewardBaselineView {
  return new GlobalRewardBaselineView(
    item.code,
    item.title,
    item.checksum,
    text.truncate(item.source, 80),
    text.truncate(item.name, 64),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRewardBaselineViews(items: GlobalRewardBaseline[]): GlobalRewardBaselineView[] {
  const views: GlobalRewardBaselineView[] = [];
  for (const item of items) {
    views.push(toGlobalRewardBaselineView(item));
  }
  return views;
}

export function sumGlobalRewardBaselineView(view: GlobalRewardBaselineView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
