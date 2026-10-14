import * as text from "../../../../kit/text.js";
import { PlacementVariance } from "./placement-variance.js";

/** How screens and exports show a placement variance. */
export class PlacementVarianceView {
  code: string;
  label: string;
  checksum: string;
  quantity: string;
  discount: string;
  startsAt: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    checksum: string,
    quantity: string,
    discount: string,
    startsAt: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.quantity = quantity;
    this.discount = discount;
    this.startsAt = startsAt;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementVarianceView(item: PlacementVariance): PlacementVarianceView {
  return new PlacementVarianceView(
    text.truncate(item.code, 64),
    item.label,
    item.checksum,
    String(item.quantity),
    item.discount.toFixed(2),
    String(item.startsAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementVarianceViews(items: PlacementVariance[]): PlacementVarianceView[] {
  const views: PlacementVarianceView[] = [];
  for (const item of items) {
    views.push(toPlacementVarianceView(item));
  }
  return views;
}

export function sumPlacementVarianceView(view: PlacementVarianceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedQuantity + parsedDiscount + parsedStartsAt;
}
