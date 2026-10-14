import { SenderEstimate } from "./sender-estimate.js";

/** How screens and exports show a sender estimate. */
export class SenderEstimateView {
  code: string;
  label: string;
  campaignRef: string;
  summaryText: string;
  description: string;
  clicks: string;
  ceilingText: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    summaryText: string,
    description: string,
    clicks: string,
    ceilingText: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.summaryText = summaryText;
    this.description = description;
    this.clicks = clicks;
    this.ceilingText = ceilingText;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toSenderEstimateView(item: SenderEstimate): SenderEstimateView {
  return new SenderEstimateView(
    item.code,
    item.label,
    item.campaignRef,
    item.summary,
    item.description,
    String(item.clicks),
    item.ceiling.toFixed(2),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderEstimateViews(items: SenderEstimate[]): SenderEstimateView[] {
  const views: SenderEstimateView[] = [];
  for (const item of items) {
    views.push(toSenderEstimateView(item));
  }
  return views;
}

export function sumSenderEstimateView(view: SenderEstimateView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedClicks + parsedCeiling + parsedUpdatedAt;
}
