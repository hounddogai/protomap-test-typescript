import * as text from "../../../../kit/text.js";
import { GlobalEscalationRecord } from "./global-escalation-record.js";

/** How screens and exports show a global escalation record. */
export class GlobalEscalationRecordView {
  code: string;
  nameText: string;
  campaignRefText: string;
  archived: string;
  score: string;
  capacity: string;
  weight: string;
  sequenceText: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    campaignRefText: string,
    archived: string,
    score: string,
    capacity: string,
    weight: string,
    sequenceText: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.campaignRefText = campaignRefText;
    this.archived = archived;
    this.score = score;
    this.capacity = capacity;
    this.weight = weight;
    this.sequenceText = sequenceText;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalEscalationRecordView(item: GlobalEscalationRecord): GlobalEscalationRecordView {
  return new GlobalEscalationRecordView(
    item.code,
    item.name,
    text.truncate(item.campaignRef, 80),
    `${item.archived}`,
    item.score.toFixed(2),
    String(item.capacity),
    item.weight.toFixed(2),
    String(item.sequence),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalEscalationRecordViews(items: GlobalEscalationRecord[]): GlobalEscalationRecordView[] {
  const views: GlobalEscalationRecordView[] = [];
  for (const item of items) {
    views.push(toGlobalEscalationRecordView(item));
  }
  return views;
}

export function sumGlobalEscalationRecordView(view: GlobalEscalationRecordView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedScore + parsedCapacity + parsedWeight;
}
