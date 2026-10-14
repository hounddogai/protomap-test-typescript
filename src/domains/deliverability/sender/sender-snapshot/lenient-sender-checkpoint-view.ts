import * as text from "../../../../kit/text.js";
import { LenientSenderCheckpoint } from "./lenient-sender-checkpoint.js";

/** How screens and exports show a lenient sender checkpoint. */
export class LenientSenderCheckpointView {
  codeText: string;
  label: string;
  impressions: string;
  limit: string;
  frequencyCap: string;
  windowDays: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    impressions: string,
    limit: string,
    frequencyCap: string,
    windowDays: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.impressions = impressions;
    this.limit = limit;
    this.frequencyCap = frequencyCap;
    this.windowDays = windowDays;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSenderCheckpointView(item: LenientSenderCheckpoint): LenientSenderCheckpointView {
  return new LenientSenderCheckpointView(
    item.code,
    item.label,
    String(item.impressions),
    String(item.limit),
    String(item.frequencyCap),
    String(item.windowDays),
    text.truncate(item.ownerId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSenderCheckpointViews(items: LenientSenderCheckpoint[]): LenientSenderCheckpointView[] {
  const views: LenientSenderCheckpointView[] = [];
  for (const item of items) {
    views.push(toLenientSenderCheckpointView(item));
  }
  return views;
}

export function sumLenientSenderCheckpointView(view: LenientSenderCheckpointView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedImpressions + parsedLimit + parsedFrequencyCap;
}
