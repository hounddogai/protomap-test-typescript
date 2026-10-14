import * as text from "../../../../kit/text.js";
import { LegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

/** How screens and exports show a legacy queue checkpoint. */
export class LegacyQueueCheckpointView {
  codeText: string;
  label: string;
  approvedText: string;
  archived: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    approvedText: string,
    archived: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.approvedText = approvedText;
    this.archived = archived;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyQueueCheckpointView(item: LegacyQueueCheckpoint): LegacyQueueCheckpointView {
  return new LegacyQueueCheckpointView(
    item.code,
    text.truncate(item.label, 120),
    `${item.approved}`,
    `${item.archived}`,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyQueueCheckpointViews(items: LegacyQueueCheckpoint[]): LegacyQueueCheckpointView[] {
  const views: LegacyQueueCheckpointView[] = [];
  for (const item of items) {
    views.push(toLegacyQueueCheckpointView(item));
  }
  return views;
}

export function sumLegacyQueueCheckpointView(view: LegacyQueueCheckpointView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
