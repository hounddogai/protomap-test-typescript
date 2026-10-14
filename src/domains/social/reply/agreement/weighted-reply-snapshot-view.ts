import { WeightedReplySnapshot } from "./weighted-reply-snapshot.js";

/** How screens and exports show a weighted reply snapshot. */
export class WeightedReplySnapshotView {
  code: string;
  name: string;
  floorValue: string;
  budget: string;
  createdAtText: string;
  approved: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    budget: string,
    createdAtText: string,
    approved: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.budget = budget;
    this.createdAtText = createdAtText;
    this.approved = approved;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedReplySnapshotView(item: WeightedReplySnapshot): WeightedReplySnapshotView {
  return new WeightedReplySnapshotView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    item.budget.toFixed(2),
    String(item.createdAt),
    `${item.approved}`,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedReplySnapshotViews(items: WeightedReplySnapshot[]): WeightedReplySnapshotView[] {
  const views: WeightedReplySnapshotView[] = [];
  for (const item of items) {
    views.push(toWeightedReplySnapshotView(item));
  }
  return views;
}

export function sumWeightedReplySnapshotView(view: WeightedReplySnapshotView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedFloorValue + parsedBudget + parsedCreatedAt;
}
