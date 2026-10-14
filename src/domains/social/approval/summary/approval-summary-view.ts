import * as text from "../../../../kit/text.js";
import { ApprovalSummary } from "./approval-summary.js";

/** How screens and exports show a approval summary. */
export class ApprovalSummaryView {
  codeText: string;
  title: string;
  localeText: string;
  variant: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    localeText: string,
    variant: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.localeText = localeText;
    this.variant = variant;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalSummaryView(item: ApprovalSummary): ApprovalSummaryView {
  return new ApprovalSummaryView(
    item.code,
    text.truncate(item.title, 80),
    item.locale,
    item.variant,
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalSummaryViews(items: ApprovalSummary[]): ApprovalSummaryView[] {
  const views: ApprovalSummaryView[] = [];
  for (const item of items) {
    views.push(toApprovalSummaryView(item));
  }
  return views;
}

export function sumApprovalSummaryView(view: ApprovalSummaryView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
