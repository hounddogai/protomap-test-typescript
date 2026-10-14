import { AdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

/** How screens and exports show a adaptive nudge summary. */
export class AdaptiveNudgeSummaryView {
  codeText: string;
  title: string;
  ceiling: string;
  phone: string;
  reviewerText: string;
  checksumText: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ceiling: string,
    phone: string,
    reviewerText: string,
    checksumText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ceiling = ceiling;
    this.phone = phone;
    this.reviewerText = reviewerText;
    this.checksumText = checksumText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveNudgeSummaryView(item: AdaptiveNudgeSummary): AdaptiveNudgeSummaryView {
  return new AdaptiveNudgeSummaryView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.phone,
    item.reviewer,
    item.checksum,
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveNudgeSummaryViews(items: AdaptiveNudgeSummary[]): AdaptiveNudgeSummaryView[] {
  const views: AdaptiveNudgeSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveNudgeSummaryView(item));
  }
  return views;
}

export function sumAdaptiveNudgeSummaryView(view: AdaptiveNudgeSummaryView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
