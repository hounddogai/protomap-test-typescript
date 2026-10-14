import * as text from "../../../../kit/text.js";
import { CappedFlightBaseline } from "./capped-flight-baseline.js";

/** How screens and exports show a capped flight baseline. */
export class CappedFlightBaselineView {
  code: string;
  title: string;
  updatedAtText: string;
  nameText: string;
  visibleText: string;
  segment: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    updatedAtText: string,
    nameText: string,
    visibleText: string,
    segment: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAtText = updatedAtText;
    this.nameText = nameText;
    this.visibleText = visibleText;
    this.segment = segment;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFlightBaselineView(item: CappedFlightBaseline): CappedFlightBaselineView {
  return new CappedFlightBaselineView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 120),
    String(item.updatedAt),
    item.name,
    `${item.visible}`,
    item.segment,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFlightBaselineViews(items: CappedFlightBaseline[]): CappedFlightBaselineView[] {
  const views: CappedFlightBaselineView[] = [];
  for (const item of items) {
    views.push(toCappedFlightBaselineView(item));
  }
  return views;
}

export function sumCappedFlightBaselineView(view: CappedFlightBaselineView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedUpdatedAt + parsedDiscount;
}
