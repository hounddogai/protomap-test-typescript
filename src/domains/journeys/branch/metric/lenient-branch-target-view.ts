import * as text from "../../../../kit/text.js";
import { LenientBranchTarget } from "./lenient-branch-target.js";

/** How screens and exports show a lenient branch target. */
export class LenientBranchTargetView {
  code: string;
  label: string;
  phone: string;
  journeyId: string;
  category: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    phone: string,
    journeyId: string,
    category: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.journeyId = journeyId;
    this.category = category;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientBranchTargetView(item: LenientBranchTarget): LenientBranchTargetView {
  return new LenientBranchTargetView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.phone, 40),
    item.journeyId,
    item.category,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientBranchTargetViews(items: LenientBranchTarget[]): LenientBranchTargetView[] {
  const views: LenientBranchTargetView[] = [];
  for (const item of items) {
    views.push(toLenientBranchTargetView(item));
  }
  return views;
}

export function sumLenientBranchTargetView(view: LenientBranchTargetView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
