import { AdaptiveRedemptionSummary } from "./adaptive-redemption-summary.js";

/** How screens and exports show a adaptive redemption summary. */
export class AdaptiveRedemptionSummaryView {
  code: string;
  title: string;
  channel: string;
  durationMinutesText: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    durationMinutesText: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.durationMinutesText = durationMinutesText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveRedemptionSummaryView(item: AdaptiveRedemptionSummary): AdaptiveRedemptionSummaryView {
  return new AdaptiveRedemptionSummaryView(
    item.code,
    item.title,
    item.channel,
    String(item.durationMinutes),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveRedemptionSummaryViews(items: AdaptiveRedemptionSummary[]): AdaptiveRedemptionSummaryView[] {
  const views: AdaptiveRedemptionSummaryView[] = [];
  for (const item of items) {
    views.push(toAdaptiveRedemptionSummaryView(item));
  }
  return views;
}

export function sumAdaptiveRedemptionSummaryView(view: AdaptiveRedemptionSummaryView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedDurationMinutes;
}
