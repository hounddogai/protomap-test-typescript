import { StrictApprovalScore } from "./strict-approval-score.js";

/** How screens and exports show a strict approval score. */
export class StrictApprovalScoreView {
  code: string;
  label: string;
  maximum: string;
  windowDays: string;
  revisionText: string;
  cost: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    maximum: string,
    windowDays: string,
    revisionText: string,
    cost: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.windowDays = windowDays;
    this.revisionText = revisionText;
    this.cost = cost;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toStrictApprovalScoreView(item: StrictApprovalScore): StrictApprovalScoreView {
  return new StrictApprovalScoreView(
    item.code,
    item.label,
    item.maximum.toFixed(2),
    String(item.windowDays),
    String(item.revision),
    item.cost.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictApprovalScoreViews(items: StrictApprovalScore[]): StrictApprovalScoreView[] {
  const views: StrictApprovalScoreView[] = [];
  for (const item of items) {
    views.push(toStrictApprovalScoreView(item));
  }
  return views;
}

export function sumStrictApprovalScoreView(view: StrictApprovalScoreView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedMaximum + parsedWindowDays + parsedRevision;
}
