import { LenientApprovalEstimate } from "./lenient-approval-estimate.js";

/** How screens and exports show a lenient approval estimate. */
export class LenientApprovalEstimateView {
  code: string;
  titleText: string;
  locale: string;
  startsAt: string;
  countryText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    locale: string,
    startsAt: string,
    countryText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.locale = locale;
    this.startsAt = startsAt;
    this.countryText = countryText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toLenientApprovalEstimateView(item: LenientApprovalEstimate): LenientApprovalEstimateView {
  return new LenientApprovalEstimateView(
    item.code,
    item.title,
    item.locale,
    String(item.startsAt),
    item.country,
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientApprovalEstimateViews(items: LenientApprovalEstimate[]): LenientApprovalEstimateView[] {
  const views: LenientApprovalEstimateView[] = [];
  for (const item of items) {
    views.push(toLenientApprovalEstimateView(item));
  }
  return views;
}

export function sumLenientApprovalEstimateView(view: LenientApprovalEstimateView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedStartsAt + parsedMargin;
}
