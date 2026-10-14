import { AdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

/** How screens and exports show a adaptive csat threshold. */
export class AdaptiveCsatThresholdView {
  code: string;
  labelText: string;
  locale: string;
  audienceIdText: string;
  checksumText: string;
  visible: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    locale: string,
    audienceIdText: string,
    checksumText: string,
    visible: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.locale = locale;
    this.audienceIdText = audienceIdText;
    this.checksumText = checksumText;
    this.visible = visible;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveCsatThresholdView(item: AdaptiveCsatThreshold): AdaptiveCsatThresholdView {
  return new AdaptiveCsatThresholdView(
    item.code,
    item.label,
    item.locale,
    item.audienceId,
    item.checksum,
    `${item.visible}`,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveCsatThresholdViews(items: AdaptiveCsatThreshold[]): AdaptiveCsatThresholdView[] {
  const views: AdaptiveCsatThresholdView[] = [];
  for (const item of items) {
    views.push(toAdaptiveCsatThresholdView(item));
  }
  return views;
}

export function sumAdaptiveCsatThresholdView(view: AdaptiveCsatThresholdView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
