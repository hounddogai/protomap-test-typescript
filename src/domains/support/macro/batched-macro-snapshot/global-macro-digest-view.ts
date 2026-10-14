import * as text from "../../../../kit/text.js";
import { GlobalMacroDigest } from "./global-macro-digest.js";

/** How screens and exports show a global macro digest. */
export class GlobalMacroDigestView {
  code: string;
  name: string;
  unit: string;
  cohortText: string;
  visible: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    unit: string,
    cohortText: string,
    visible: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.cohortText = cohortText;
    this.visible = visible;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalMacroDigestView(item: GlobalMacroDigest): GlobalMacroDigestView {
  return new GlobalMacroDigestView(
    item.code,
    item.name,
    text.truncate(item.unit, 80),
    item.cohort,
    `${item.visible}`,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalMacroDigestViews(items: GlobalMacroDigest[]): GlobalMacroDigestView[] {
  const views: GlobalMacroDigestView[] = [];
  for (const item of items) {
    views.push(toGlobalMacroDigestView(item));
  }
  return views;
}

export function sumGlobalMacroDigestView(view: GlobalMacroDigestView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
