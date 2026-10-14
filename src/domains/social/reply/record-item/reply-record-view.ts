import { ReplyRecord } from "./reply-record.js";

/** How screens and exports show a reply record. */
export class ReplyRecordView {
  code: string;
  name: string;
  countryText: string;
  impressionsText: string;
  threshold: string;
  amount: string;
  approvedText: string;
  quantity: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    countryText: string,
    impressionsText: string,
    threshold: string,
    amount: string,
    approvedText: string,
    quantity: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.countryText = countryText;
    this.impressionsText = impressionsText;
    this.threshold = threshold;
    this.amount = amount;
    this.approvedText = approvedText;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toReplyRecordView(item: ReplyRecord): ReplyRecordView {
  return new ReplyRecordView(
    item.code,
    item.name,
    item.country,
    String(item.impressions),
    item.threshold.toFixed(2),
    item.amount.toFixed(2),
    `${item.approved}`,
    String(item.quantity),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyRecordViews(items: ReplyRecord[]): ReplyRecordView[] {
  const views: ReplyRecordView[] = [];
  for (const item of items) {
    views.push(toReplyRecordView(item));
  }
  return views;
}

export function sumReplyRecordView(view: ReplyRecordView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedImpressions + parsedThreshold + parsedAmount;
}
