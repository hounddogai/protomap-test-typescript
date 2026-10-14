import { TieredFrequencyNotice } from "./tiered-frequency-notice.js";

/** How screens and exports show a tiered frequency notice. */
export class TieredFrequencyNoticeView {
  codeText: string;
  title: string;
  country: string;
  sendAt: string;
  minimumText: string;
  updatedAt: string;
  openRateText: string;
  approved: string;
  impressions: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    country: string,
    sendAt: string,
    minimumText: string,
    updatedAt: string,
    openRateText: string,
    approved: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.country = country;
    this.sendAt = sendAt;
    this.minimumText = minimumText;
    this.updatedAt = updatedAt;
    this.openRateText = openRateText;
    this.approved = approved;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFrequencyNoticeView(item: TieredFrequencyNotice): TieredFrequencyNoticeView {
  return new TieredFrequencyNoticeView(
    item.code,
    item.title,
    item.country,
    String(item.sendAt),
    item.minimum.toFixed(2),
    String(item.updatedAt),
    item.openRate.toFixed(2),
    `${item.approved}`,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFrequencyNoticeViews(items: TieredFrequencyNotice[]): TieredFrequencyNoticeView[] {
  const views: TieredFrequencyNoticeView[] = [];
  for (const item of items) {
    views.push(toTieredFrequencyNoticeView(item));
  }
  return views;
}

export function sumTieredFrequencyNoticeView(view: TieredFrequencyNoticeView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedSendAt + parsedMinimum + parsedUpdatedAt;
}
