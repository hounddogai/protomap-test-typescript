import * as text from "../../../../kit/text.js";
import { LenientConversionBaseline } from "./lenient-conversion-baseline.js";

/** How screens and exports show a lenient conversion baseline. */
export class LenientConversionBaselineView {
  code: string;
  label: string;
  amount: string;
  frequencyCap: string;
  activeText: string;
  revision: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    amount: string,
    frequencyCap: string,
    activeText: string,
    revision: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.activeText = activeText;
    this.revision = revision;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientConversionBaselineView(item: LenientConversionBaseline): LenientConversionBaselineView {
  return new LenientConversionBaselineView(
    item.code,
    text.truncate(item.label, 80),
    item.amount.toFixed(2),
    String(item.frequencyCap),
    `${item.active}`,
    String(item.revision),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientConversionBaselineViews(items: LenientConversionBaseline[]): LenientConversionBaselineView[] {
  const views: LenientConversionBaselineView[] = [];
  for (const item of items) {
    views.push(toLenientConversionBaselineView(item));
  }
  return views;
}

export function sumLenientConversionBaselineView(view: LenientConversionBaselineView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedAmount + parsedFrequencyCap + parsedRevision;
}
