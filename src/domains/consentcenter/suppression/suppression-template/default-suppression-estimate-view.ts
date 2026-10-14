import { DefaultSuppressionEstimate } from "./default-suppression-estimate.js";

/** How screens and exports show a default suppression estimate. */
export class DefaultSuppressionEstimateView {
  codeText: string;
  title: string;
  durationMinutesText: string;
  visible: string;
  expiresAt: string;
  ownerId: string;
  impressions: string;
  timezoneText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    durationMinutesText: string,
    visible: string,
    expiresAt: string,
    ownerId: string,
    impressions: string,
    timezoneText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.timezoneText = timezoneText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultSuppressionEstimateView(item: DefaultSuppressionEstimate): DefaultSuppressionEstimateView {
  return new DefaultSuppressionEstimateView(
    item.code,
    item.title,
    String(item.durationMinutes),
    `${item.visible}`,
    String(item.expiresAt),
    item.ownerId,
    String(item.impressions),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultSuppressionEstimateViews(items: DefaultSuppressionEstimate[]): DefaultSuppressionEstimateView[] {
  const views: DefaultSuppressionEstimateView[] = [];
  for (const item of items) {
    views.push(toDefaultSuppressionEstimateView(item));
  }
  return views;
}

export function sumDefaultSuppressionEstimateView(view: DefaultSuppressionEstimateView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedDurationMinutes + parsedExpiresAt + parsedImpressions;
}
