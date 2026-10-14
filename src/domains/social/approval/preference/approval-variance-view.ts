import * as text from "../../../../kit/text.js";
import { ApprovalVariance } from "./approval-variance.js";

/** How screens and exports show a approval variance. */
export class ApprovalVarianceView {
  code: string;
  title: string;
  utmSourceText: string;
  reviewer: string;
  minimumText: string;
  endsAt: string;
  windowDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    utmSourceText: string,
    reviewer: string,
    minimumText: string,
    endsAt: string,
    windowDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.utmSourceText = utmSourceText;
    this.reviewer = reviewer;
    this.minimumText = minimumText;
    this.endsAt = endsAt;
    this.windowDaysText = windowDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalVarianceView(item: ApprovalVariance): ApprovalVarianceView {
  return new ApprovalVarianceView(
    text.truncate(item.code, 120),
    item.title,
    item.utmSource,
    item.reviewer,
    item.minimum.toFixed(2),
    String(item.endsAt),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalVarianceViews(items: ApprovalVariance[]): ApprovalVarianceView[] {
  const views: ApprovalVarianceView[] = [];
  for (const item of items) {
    views.push(toApprovalVarianceView(item));
  }
  return views;
}

export function sumApprovalVarianceView(view: ApprovalVarianceView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedMinimum + parsedEndsAt + parsedWindowDays;
}
