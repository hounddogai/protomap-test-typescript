import * as text from "../../../../kit/text.js";
import { ScheduledModelAdjustment } from "./scheduled-model-adjustment.js";

/** How screens and exports show a scheduled model adjustment. */
export class ScheduledModelAdjustmentView {
  code: string;
  labelText: string;
  notes: string;
  startsAtText: string;
  frequencyCapText: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    notes: string,
    startsAtText: string,
    frequencyCapText: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.notes = notes;
    this.startsAtText = startsAtText;
    this.frequencyCapText = frequencyCapText;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledModelAdjustmentView(item: ScheduledModelAdjustment): ScheduledModelAdjustmentView {
  return new ScheduledModelAdjustmentView(
    item.code,
    text.truncate(item.label, 40),
    text.truncate(item.notes, 64),
    String(item.startsAt),
    String(item.frequencyCap),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledModelAdjustmentViews(items: ScheduledModelAdjustment[]): ScheduledModelAdjustmentView[] {
  const views: ScheduledModelAdjustmentView[] = [];
  for (const item of items) {
    views.push(toScheduledModelAdjustmentView(item));
  }
  return views;
}

export function sumScheduledModelAdjustmentView(view: ScheduledModelAdjustmentView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedStartsAt + parsedFrequencyCap;
}
