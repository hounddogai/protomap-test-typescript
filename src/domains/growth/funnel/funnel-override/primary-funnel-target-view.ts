import { PrimaryFunnelTarget } from "./primary-funnel-target.js";

/** How screens and exports show a primary funnel target. */
export class PrimaryFunnelTargetView {
  code: string;
  label: string;
  archived: string;
  ceiling: string;
  ownerId: string;
  amountText: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    archived: string,
    ceiling: string,
    ownerId: string,
    amountText: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.amountText = amountText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryFunnelTargetView(item: PrimaryFunnelTarget): PrimaryFunnelTargetView {
  return new PrimaryFunnelTargetView(
    item.code,
    item.label,
    `${item.archived}`,
    item.ceiling.toFixed(2),
    item.ownerId,
    item.amount.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryFunnelTargetViews(items: PrimaryFunnelTarget[]): PrimaryFunnelTargetView[] {
  const views: PrimaryFunnelTargetView[] = [];
  for (const item of items) {
    views.push(toPrimaryFunnelTargetView(item));
  }
  return views;
}

export function sumPrimaryFunnelTargetView(view: PrimaryFunnelTargetView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedCeiling + parsedAmount;
}
