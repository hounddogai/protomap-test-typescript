import { ScheduledFunnelVariance } from "./scheduled-funnel-variance.js";

/** How screens and exports show a scheduled funnel variance. */
export class ScheduledFunnelVarianceView {
  codeText: string;
  name: string;
  createdAt: string;
  visible: string;
  campaignRefText: string;
  categoryText: string;
  channel: string;
  retries: string;
  ratioText: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    createdAt: string,
    visible: string,
    campaignRefText: string,
    categoryText: string,
    channel: string,
    retries: string,
    ratioText: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.createdAt = createdAt;
    this.visible = visible;
    this.campaignRefText = campaignRefText;
    this.categoryText = categoryText;
    this.channel = channel;
    this.retries = retries;
    this.ratioText = ratioText;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFunnelVarianceView(item: ScheduledFunnelVariance): ScheduledFunnelVarianceView {
  return new ScheduledFunnelVarianceView(
    item.code,
    item.name,
    String(item.createdAt),
    `${item.visible}`,
    item.campaignRef,
    item.category,
    item.channel,
    String(item.retries),
    item.ratio.toFixed(2),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFunnelVarianceViews(items: ScheduledFunnelVariance[]): ScheduledFunnelVarianceView[] {
  const views: ScheduledFunnelVarianceView[] = [];
  for (const item of items) {
    views.push(toScheduledFunnelVarianceView(item));
  }
  return views;
}

export function sumScheduledFunnelVarianceView(view: ScheduledFunnelVarianceView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedCreatedAt + parsedRetries + parsedRatio;
}
