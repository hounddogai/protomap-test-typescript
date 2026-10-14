import * as text from "../../../../kit/text.js";
import { ModelCheckpoint } from "./model-checkpoint.js";

/** How screens and exports show a model checkpoint. */
export class ModelCheckpointView {
  code: string;
  label: string;
  timezoneText: string;
  cohort: string;
  reviewer: string;
  sendAt: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezoneText: string,
    cohort: string,
    reviewer: string,
    sendAt: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezoneText = timezoneText;
    this.cohort = cohort;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toModelCheckpointView(item: ModelCheckpoint): ModelCheckpointView {
  return new ModelCheckpointView(
    item.code,
    text.truncate(item.label, 40),
    item.timezone,
    text.truncate(item.cohort, 40),
    item.reviewer,
    String(item.sendAt),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelCheckpointViews(items: ModelCheckpoint[]): ModelCheckpointView[] {
  const views: ModelCheckpointView[] = [];
  for (const item of items) {
    views.push(toModelCheckpointView(item));
  }
  return views;
}

export function sumModelCheckpointView(view: ModelCheckpointView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedSendAt;
}
