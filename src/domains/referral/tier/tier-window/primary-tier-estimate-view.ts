import { PrimaryTierEstimate } from "./primary-tier-estimate.js";

/** How screens and exports show a primary tier estimate. */
export class PrimaryTierEstimateView {
  code: string;
  label: string;
  active: string;
  channel: string;
  limitText: string;
  notesText: string;
  quantity: string;
  weight: string;
  discount: string;
  updatedAtText: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    channel: string,
    limitText: string,
    notesText: string,
    quantity: string,
    weight: string,
    discount: string,
    updatedAtText: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.channel = channel;
    this.limitText = limitText;
    this.notesText = notesText;
    this.quantity = quantity;
    this.weight = weight;
    this.discount = discount;
    this.updatedAtText = updatedAtText;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTierEstimateView(item: PrimaryTierEstimate): PrimaryTierEstimateView {
  return new PrimaryTierEstimateView(
    item.code,
    item.label,
    `${item.active}`,
    item.channel,
    String(item.limit),
    item.notes,
    String(item.quantity),
    item.weight.toFixed(2),
    item.discount.toFixed(2),
    String(item.updatedAt),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTierEstimateViews(items: PrimaryTierEstimate[]): PrimaryTierEstimateView[] {
  const views: PrimaryTierEstimateView[] = [];
  for (const item of items) {
    views.push(toPrimaryTierEstimateView(item));
  }
  return views;
}

export function sumPrimaryTierEstimateView(view: PrimaryTierEstimateView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedLimit + parsedQuantity + parsedWeight;
}
