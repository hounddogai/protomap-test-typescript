import * as text from "../../../../kit/text.js";
import { DefaultNudgeScore } from "./default-nudge-score.js";

/** How screens and exports show a default nudge score. */
export class DefaultNudgeScoreView {
  code: string;
  label: string;
  checksum: string;
  locale: string;
  visible: string;
  updatedAt: string;
  amount: string;
  journeyId: string;
  phone: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    checksum: string,
    locale: string,
    visible: string,
    updatedAt: string,
    amount: string,
    journeyId: string,
    phone: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.locale = locale;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.journeyId = journeyId;
    this.phone = phone;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultNudgeScoreView(item: DefaultNudgeScore): DefaultNudgeScoreView {
  return new DefaultNudgeScoreView(
    item.code,
    item.label,
    item.checksum,
    text.truncate(item.locale, 120),
    `${item.visible}`,
    String(item.updatedAt),
    item.amount.toFixed(2),
    item.journeyId,
    item.phone,
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultNudgeScoreViews(items: DefaultNudgeScore[]): DefaultNudgeScoreView[] {
  const views: DefaultNudgeScoreView[] = [];
  for (const item of items) {
    views.push(toDefaultNudgeScoreView(item));
  }
  return views;
}

export function sumDefaultNudgeScoreView(view: DefaultNudgeScoreView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedUpdatedAt + parsedAmount + parsedGraceDays;
}
