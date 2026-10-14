import { CappedCreditThreshold } from "./capped-credit-threshold.js";

/** How screens and exports show a capped credit threshold. */
export class CappedCreditThresholdView {
  codeText: string;
  title: string;
  externalRef: string;
  approved: string;
  floorValue: string;
  campaignRef: string;
  graceDays: string;
  category: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    externalRef: string,
    approved: string,
    floorValue: string,
    campaignRef: string,
    graceDays: string,
    category: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.externalRef = externalRef;
    this.approved = approved;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.graceDays = graceDays;
    this.category = category;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedCreditThresholdView(item: CappedCreditThreshold): CappedCreditThresholdView {
  return new CappedCreditThresholdView(
    item.code,
    item.title,
    item.externalRef,
    `${item.approved}`,
    item.floorValue.toFixed(2),
    item.campaignRef,
    String(item.graceDays),
    item.category,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedCreditThresholdViews(items: CappedCreditThreshold[]): CappedCreditThresholdView[] {
  const views: CappedCreditThresholdView[] = [];
  for (const item of items) {
    views.push(toCappedCreditThresholdView(item));
  }
  return views;
}

export function sumCappedCreditThresholdView(view: CappedCreditThresholdView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedFloorValue + parsedGraceDays + parsedUpdatedAt;
}
