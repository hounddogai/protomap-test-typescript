import * as text from "../../../../kit/text.js";
import { StrictCreativeCycle } from "./strict-creative-cycle.js";

/** How screens and exports show a strict creative cycle. */
export class StrictCreativeCycleView {
  codeText: string;
  title: string;
  utmSourceText: string;
  label: string;
  active: string;
  unitText: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    utmSourceText: string,
    label: string,
    active: string,
    unitText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.utmSourceText = utmSourceText;
    this.label = label;
    this.active = active;
    this.unitText = unitText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreativeCycleView(item: StrictCreativeCycle): StrictCreativeCycleView {
  return new StrictCreativeCycleView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.utmSource, 80),
    item.label,
    `${item.active}`,
    text.truncate(item.unit, 64),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreativeCycleViews(items: StrictCreativeCycle[]): StrictCreativeCycleView[] {
  const views: StrictCreativeCycleView[] = [];
  for (const item of items) {
    views.push(toStrictCreativeCycleView(item));
  }
  return views;
}

export function sumStrictCreativeCycleView(view: StrictCreativeCycleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
