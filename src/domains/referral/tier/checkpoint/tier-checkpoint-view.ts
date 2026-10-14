import * as text from "../../../../kit/text.js";
import { TierCheckpoint } from "./tier-checkpoint.js";

/** How screens and exports show a tier checkpoint. */
export class TierCheckpointView {
  code: string;
  name: string;
  summaryText: string;
  active: string;
  timezoneText: string;
  sourceText: string;
  capacityText: string;
  reviewer: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    summaryText: string,
    active: string,
    timezoneText: string,
    sourceText: string,
    capacityText: string,
    reviewer: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.summaryText = summaryText;
    this.active = active;
    this.timezoneText = timezoneText;
    this.sourceText = sourceText;
    this.capacityText = capacityText;
    this.reviewer = reviewer;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toTierCheckpointView(item: TierCheckpoint): TierCheckpointView {
  return new TierCheckpointView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.summary, 80),
    `${item.active}`,
    text.truncate(item.timezone, 120),
    item.source,
    String(item.capacity),
    text.truncate(item.reviewer, 120),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTierCheckpointViews(items: TierCheckpoint[]): TierCheckpointView[] {
  const views: TierCheckpointView[] = [];
  for (const item of items) {
    views.push(toTierCheckpointView(item));
  }
  return views;
}

export function sumTierCheckpointView(view: TierCheckpointView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedCapacity;
}
