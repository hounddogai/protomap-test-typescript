import * as text from "../../../../kit/text.js";
import { ReputationCheckpoint } from "./reputation-checkpoint.js";

/** How screens and exports show a reputation checkpoint. */
export class ReputationCheckpointView {
  code: string;
  title: string;
  activeText: string;
  notes: string;
  weightText: string;
  region: string;
  summaryText: string;
  durationMinutesText: string;
  description: string;
  pinned: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    activeText: string,
    notes: string,
    weightText: string,
    region: string,
    summaryText: string,
    durationMinutesText: string,
    description: string,
    pinned: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.activeText = activeText;
    this.notes = notes;
    this.weightText = weightText;
    this.region = region;
    this.summaryText = summaryText;
    this.durationMinutesText = durationMinutesText;
    this.description = description;
    this.pinned = pinned;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toReputationCheckpointView(item: ReputationCheckpoint): ReputationCheckpointView {
  return new ReputationCheckpointView(
    item.code,
    item.title,
    `${item.active}`,
    text.truncate(item.notes, 80),
    item.weight.toFixed(2),
    item.region,
    item.summary,
    String(item.durationMinutes),
    text.truncate(item.description, 80),
    `${item.pinned}`,
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationCheckpointViews(items: ReputationCheckpoint[]): ReputationCheckpointView[] {
  const views: ReputationCheckpointView[] = [];
  for (const item of items) {
    views.push(toReputationCheckpointView(item));
  }
  return views;
}

export function sumReputationCheckpointView(view: ReputationCheckpointView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedWeight + parsedDurationMinutes;
}
