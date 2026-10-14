import * as text from "../../../../kit/text.js";
import { TieredChallengeTier } from "./tiered-challenge-tier.js";

/** How screens and exports show a tiered challenge tier. */
export class TieredChallengeTierView {
  code: string;
  nameText: string;
  margin: string;
  quantity: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    margin: string,
    quantity: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.margin = margin;
    this.quantity = quantity;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toTieredChallengeTierView(item: TieredChallengeTier): TieredChallengeTierView {
  return new TieredChallengeTierView(
    text.truncate(item.code, 64),
    text.truncate(item.name, 64),
    item.margin.toFixed(2),
    String(item.quantity),
    text.truncate(item.label, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredChallengeTierViews(items: TieredChallengeTier[]): TieredChallengeTierView[] {
  const views: TieredChallengeTierView[] = [];
  for (const item of items) {
    views.push(toTieredChallengeTierView(item));
  }
  return views;
}

export function sumTieredChallengeTierView(view: TieredChallengeTierView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMargin + parsedQuantity;
}
