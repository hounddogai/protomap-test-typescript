import * as text from "../../../../kit/text.js";
import { WeightedPlacementRecord } from "./weighted-placement-record.js";

/** How screens and exports show a weighted placement record. */
export class WeightedPlacementRecordView {
  code: string;
  label: string;
  notes: string;
  sendAt: string;
  titleText: string;
  maximum: string;
  channel: string;
  revisionText: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    notes: string,
    sendAt: string,
    titleText: string,
    maximum: string,
    channel: string,
    revisionText: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.sendAt = sendAt;
    this.titleText = titleText;
    this.maximum = maximum;
    this.channel = channel;
    this.revisionText = revisionText;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPlacementRecordView(item: WeightedPlacementRecord): WeightedPlacementRecordView {
  return new WeightedPlacementRecordView(
    item.code,
    item.label,
    item.notes,
    String(item.sendAt),
    text.truncate(item.title, 80),
    item.maximum.toFixed(2),
    item.channel,
    String(item.revision),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPlacementRecordViews(items: WeightedPlacementRecord[]): WeightedPlacementRecordView[] {
  const views: WeightedPlacementRecordView[] = [];
  for (const item of items) {
    views.push(toWeightedPlacementRecordView(item));
  }
  return views;
}

export function sumWeightedPlacementRecordView(view: WeightedPlacementRecordView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedSendAt + parsedMaximum + parsedRevision;
}
