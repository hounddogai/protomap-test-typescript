import { TieredApprovalEstimate } from "./tiered-approval-estimate.js";

/** How screens and exports show a tiered approval estimate. */
export class TieredApprovalEstimateView {
  code: string;
  titleText: string;
  endsAt: string;
  categoryText: string;
  graceDaysText: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    endsAt: string,
    categoryText: string,
    graceDaysText: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.categoryText = categoryText;
    this.graceDaysText = graceDaysText;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredApprovalEstimateView(item: TieredApprovalEstimate): TieredApprovalEstimateView {
  return new TieredApprovalEstimateView(
    item.code,
    item.title,
    String(item.endsAt),
    item.category,
    String(item.graceDays),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredApprovalEstimateViews(items: TieredApprovalEstimate[]): TieredApprovalEstimateView[] {
  const views: TieredApprovalEstimateView[] = [];
  for (const item of items) {
    views.push(toTieredApprovalEstimateView(item));
  }
  return views;
}

export function sumTieredApprovalEstimateView(view: TieredApprovalEstimateView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedEndsAt + parsedGraceDays + parsedFrequencyCap;
}
