import { WeightedCreativeAllocation } from "./weighted-creative-allocation.js";

/** How screens and exports show a weighted creative allocation. */
export class WeightedCreativeAllocationView {
  codeText: string;
  name: string;
  localeText: string;
  active: string;
  amountText: string;
  expiresAt: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    localeText: string,
    active: string,
    amountText: string,
    expiresAt: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.localeText = localeText;
    this.active = active;
    this.amountText = amountText;
    this.expiresAt = expiresAt;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedCreativeAllocationView(item: WeightedCreativeAllocation): WeightedCreativeAllocationView {
  return new WeightedCreativeAllocationView(
    item.code,
    item.name,
    item.locale,
    `${item.active}`,
    item.amount.toFixed(2),
    String(item.expiresAt),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedCreativeAllocationViews(items: WeightedCreativeAllocation[]): WeightedCreativeAllocationView[] {
  const views: WeightedCreativeAllocationView[] = [];
  for (const item of items) {
    views.push(toWeightedCreativeAllocationView(item));
  }
  return views;
}

export function sumWeightedCreativeAllocationView(view: WeightedCreativeAllocationView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedAmount + parsedExpiresAt + parsedClicks;
}
