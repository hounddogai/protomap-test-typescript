import * as text from "../../../../kit/text.js";
import { ReplyPlan } from "./reply-plan.js";

/** How screens and exports show a reply plan. */
export class ReplyPlanView {
  code: string;
  title: string;
  category: string;
  label: string;
  utmSourceText: string;
  notes: string;
  source: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    category: string,
    label: string,
    utmSourceText: string,
    notes: string,
    source: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.label = label;
    this.utmSourceText = utmSourceText;
    this.notes = notes;
    this.source = source;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toReplyPlanView(item: ReplyPlan): ReplyPlanView {
  return new ReplyPlanView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.category, 64),
    item.label,
    text.truncate(item.utmSource, 120),
    item.notes,
    text.truncate(item.source, 64),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyPlanViews(items: ReplyPlan[]): ReplyPlanView[] {
  const views: ReplyPlanView[] = [];
  for (const item of items) {
    views.push(toReplyPlanView(item));
  }
  return views;
}

export function sumReplyPlanView(view: ReplyPlanView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedGraceDays;
}
