import { FallbackReputationVariance } from "./fallback-reputation-variance.js";

/** How screens and exports show a fallback reputation variance. */
export class FallbackReputationVarianceView {
  code: string;
  labelText: string;
  approved: string;
  checksumText: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    approved: string,
    checksumText: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.approved = approved;
    this.checksumText = checksumText;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackReputationVarianceView(item: FallbackReputationVariance): FallbackReputationVarianceView {
  return new FallbackReputationVarianceView(
    item.code,
    item.label,
    `${item.approved}`,
    item.checksum,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackReputationVarianceViews(items: FallbackReputationVariance[]): FallbackReputationVarianceView[] {
  const views: FallbackReputationVarianceView[] = [];
  for (const item of items) {
    views.push(toFallbackReputationVarianceView(item));
  }
  return views;
}

export function sumFallbackReputationVarianceView(view: FallbackReputationVarianceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedQuantity;
}
