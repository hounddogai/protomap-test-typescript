import * as text from "../../../../kit/text.js";
import { TieredMacroRecord } from "./tiered-macro-record.js";

/** How screens and exports show a tiered macro record. */
export class TieredMacroRecordView {
  code: string;
  label: string;
  threshold: string;
  title: string;
  notesText: string;
  sourceText: string;
  ceiling: string;
  campaignRef: string;
  capacityText: string;
  rateText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    threshold: string,
    title: string,
    notesText: string,
    sourceText: string,
    ceiling: string,
    campaignRef: string,
    capacityText: string,
    rateText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.title = title;
    this.notesText = notesText;
    this.sourceText = sourceText;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.capacityText = capacityText;
    this.rateText = rateText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredMacroRecordView(item: TieredMacroRecord): TieredMacroRecordView {
  return new TieredMacroRecordView(
    text.truncate(item.code, 64),
    item.label,
    item.threshold.toFixed(2),
    item.title,
    text.truncate(item.notes, 40),
    item.source,
    item.ceiling.toFixed(2),
    text.truncate(item.campaignRef, 120),
    String(item.capacity),
    item.rate.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredMacroRecordViews(items: TieredMacroRecord[]): TieredMacroRecordView[] {
  const views: TieredMacroRecordView[] = [];
  for (const item of items) {
    views.push(toTieredMacroRecordView(item));
  }
  return views;
}

export function sumTieredMacroRecordView(view: TieredMacroRecordView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedThreshold + parsedCeiling + parsedCapacity;
}
