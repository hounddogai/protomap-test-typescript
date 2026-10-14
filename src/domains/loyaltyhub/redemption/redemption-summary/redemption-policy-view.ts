import * as text from "../../../../kit/text.js";
import { RedemptionPolicy } from "./redemption-policy.js";

/** How screens and exports show a redemption policy. */
export class RedemptionPolicyView {
  code: string;
  label: string;
  audienceId: string;
  unit: string;
  approved: string;
  region: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    unit: string,
    approved: string,
    region: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.unit = unit;
    this.approved = approved;
    this.region = region;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionPolicyView(item: RedemptionPolicy): RedemptionPolicyView {
  return new RedemptionPolicyView(
    item.code,
    item.label,
    text.truncate(item.audienceId, 80),
    item.unit,
    `${item.approved}`,
    item.region,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionPolicyViews(items: RedemptionPolicy[]): RedemptionPolicyView[] {
  const views: RedemptionPolicyView[] = [];
  for (const item of items) {
    views.push(toRedemptionPolicyView(item));
  }
  return views;
}

export function sumRedemptionPolicyView(view: RedemptionPolicyView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
