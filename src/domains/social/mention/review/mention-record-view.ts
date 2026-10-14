import * as text from "../../../../kit/text.js";
import { MentionRecord } from "./mention-record.js";

/** How screens and exports show a mention record. */
export class MentionRecordView {
  code: string;
  nameText: string;
  active: string;
  discount: string;
  statusLabel: string;

  constructor(code: string, nameText: string, active: string, discount: string, statusLabel: string) {
    this.code = code;
    this.nameText = nameText;
    this.active = active;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toMentionRecordView(item: MentionRecord): MentionRecordView {
  return new MentionRecordView(
    item.code,
    text.truncate(item.name, 80),
    `${item.active}`,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionRecordViews(items: MentionRecord[]): MentionRecordView[] {
  const views: MentionRecordView[] = [];
  for (const item of items) {
    views.push(toMentionRecordView(item));
  }
  return views;
}

export function sumMentionRecordView(view: MentionRecordView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
