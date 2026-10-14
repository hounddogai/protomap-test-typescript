import { FallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

/** How screens and exports show a fallback macro snapshot. */
export class FallbackMacroSnapshotView {
  code: string;
  name: string;
  rate: string;
  budget: string;
  discountText: string;
  bidText: string;
  sendAt: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    rate: string,
    budget: string,
    discountText: string,
    bidText: string,
    sendAt: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budget = budget;
    this.discountText = discountText;
    this.bidText = bidText;
    this.sendAt = sendAt;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackMacroSnapshotView(item: FallbackMacroSnapshot): FallbackMacroSnapshotView {
  return new FallbackMacroSnapshotView(
    item.code,
    item.name,
    item.rate.toFixed(2),
    item.budget.toFixed(2),
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    String(item.sendAt),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackMacroSnapshotViews(items: FallbackMacroSnapshot[]): FallbackMacroSnapshotView[] {
  const views: FallbackMacroSnapshotView[] = [];
  for (const item of items) {
    views.push(toFallbackMacroSnapshotView(item));
  }
  return views;
}

export function sumFallbackMacroSnapshotView(view: FallbackMacroSnapshotView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedRate + parsedBudget + parsedDiscount;
}
