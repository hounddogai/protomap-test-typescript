import * as text from "../../../../kit/text.js";
import { MentionAdjustment } from "./mention-adjustment.js";

/** How screens and exports show a mention adjustment. */
export class MentionAdjustmentView {
  code: string;
  labelText: string;
  discount: string;
  cost: string;
  utmSource: string;
  revision: string;
  priority: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    discount: string,
    cost: string,
    utmSource: string,
    revision: string,
    priority: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.discount = discount;
    this.cost = cost;
    this.utmSource = utmSource;
    this.revision = revision;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toMentionAdjustmentView(item: MentionAdjustment): MentionAdjustmentView {
  return new MentionAdjustmentView(
    text.truncate(item.code, 120),
    item.label,
    item.discount.toFixed(2),
    item.cost.toFixed(2),
    item.utmSource,
    String(item.revision),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionAdjustmentViews(items: MentionAdjustment[]): MentionAdjustmentView[] {
  const views: MentionAdjustmentView[] = [];
  for (const item of items) {
    views.push(toMentionAdjustmentView(item));
  }
  return views;
}

export function sumMentionAdjustmentView(view: MentionAdjustmentView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedDiscount + parsedCost + parsedRevision;
}
