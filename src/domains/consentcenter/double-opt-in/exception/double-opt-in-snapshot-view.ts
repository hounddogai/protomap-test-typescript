import * as text from "../../../../kit/text.js";
import { DoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

/** How screens and exports show a double opt in snapshot. */
export class DoubleOptInSnapshotView {
  code: string;
  titleText: string;
  channel: string;
  ceiling: string;
  reviewer: string;
  name: string;
  labelText: string;
  notesText: string;
  thresholdText: string;
  cost: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    channel: string,
    ceiling: string,
    reviewer: string,
    name: string,
    labelText: string,
    notesText: string,
    thresholdText: string,
    cost: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.channel = channel;
    this.ceiling = ceiling;
    this.reviewer = reviewer;
    this.name = name;
    this.labelText = labelText;
    this.notesText = notesText;
    this.thresholdText = thresholdText;
    this.cost = cost;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInSnapshotView(item: DoubleOptInSnapshot): DoubleOptInSnapshotView {
  return new DoubleOptInSnapshotView(
    text.truncate(item.code, 80),
    item.title,
    item.channel,
    item.ceiling.toFixed(2),
    item.reviewer,
    text.truncate(item.name, 80),
    item.label,
    item.notes,
    item.threshold.toFixed(2),
    item.cost.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInSnapshotViews(items: DoubleOptInSnapshot[]): DoubleOptInSnapshotView[] {
  const views: DoubleOptInSnapshotView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInSnapshotView(item));
  }
  return views;
}

export function sumDoubleOptInSnapshotView(view: DoubleOptInSnapshotView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCeiling + parsedThreshold + parsedCost;
}
