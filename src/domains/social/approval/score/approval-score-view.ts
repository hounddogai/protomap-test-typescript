import * as text from "../../../../kit/text.js";
import { ApprovalScore } from "./approval-score.js";

/** How screens and exports show a approval score. */
export class ApprovalScoreView {
  code: string;
  title: string;
  audienceId: string;
  localeText: string;
  impressionsText: string;
  amountText: string;
  quantity: string;
  timezoneText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    localeText: string,
    impressionsText: string,
    amountText: string,
    quantity: string,
    timezoneText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.localeText = localeText;
    this.impressionsText = impressionsText;
    this.amountText = amountText;
    this.quantity = quantity;
    this.timezoneText = timezoneText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalScoreView(item: ApprovalScore): ApprovalScoreView {
  return new ApprovalScoreView(
    item.code,
    text.truncate(item.title, 80),
    item.audienceId,
    item.locale,
    String(item.impressions),
    item.amount.toFixed(2),
    String(item.quantity),
    text.truncate(item.timezone, 80),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalScoreViews(items: ApprovalScore[]): ApprovalScoreView[] {
  const views: ApprovalScoreView[] = [];
  for (const item of items) {
    views.push(toApprovalScoreView(item));
  }
  return views;
}

export function sumApprovalScoreView(view: ApprovalScoreView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedImpressions + parsedAmount + parsedQuantity;
}
