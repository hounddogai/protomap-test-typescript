import { PendingTierVariance } from "./pending-tier-variance.js";

/** How screens and exports show a pending tier variance. */
export class PendingTierVarianceView {
  code: string;
  nameText: string;
  minimumText: string;
  floorValueText: string;
  batchSize: string;
  revision: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    minimumText: string,
    floorValueText: string,
    batchSize: string,
    revision: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.minimumText = minimumText;
    this.floorValueText = floorValueText;
    this.batchSize = batchSize;
    this.revision = revision;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingTierVarianceView(item: PendingTierVariance): PendingTierVarianceView {
  return new PendingTierVarianceView(
    item.code,
    item.name,
    item.minimum.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.batchSize),
    String(item.revision),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingTierVarianceViews(items: PendingTierVariance[]): PendingTierVarianceView[] {
  const views: PendingTierVarianceView[] = [];
  for (const item of items) {
    views.push(toPendingTierVarianceView(item));
  }
  return views;
}

export function sumPendingTierVarianceView(view: PendingTierVarianceView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  return parsedMinimum + parsedFloorValue + parsedBatchSize;
}
