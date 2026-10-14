import * as text from "../../../../kit/text.js";
import { MentionEstimate } from "./mention-estimate.js";

/** How screens and exports show a mention estimate. */
export class MentionEstimateView {
  code: string;
  title: string;
  phone: string;
  cohort: string;
  endsAt: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phone: string,
    cohort: string,
    endsAt: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.cohort = cohort;
    this.endsAt = endsAt;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionEstimateView(item: MentionEstimate): MentionEstimateView {
  return new MentionEstimateView(
    item.code,
    text.truncate(item.title, 80),
    text.truncate(item.phone, 80),
    item.cohort,
    String(item.endsAt),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionEstimateViews(items: MentionEstimate[]): MentionEstimateView[] {
  const views: MentionEstimateView[] = [];
  for (const item of items) {
    views.push(toMentionEstimateView(item));
  }
  return views;
}

export function sumMentionEstimateView(view: MentionEstimateView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedEndsAt + parsedCeiling;
}
