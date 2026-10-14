import { RegionalPayoutNotice } from "./regional-payout-notice.js";

/** How screens and exports show a regional payout notice. */
export class RegionalPayoutNoticeView {
  code: string;
  titleText: string;
  unitText: string;
  minimumText: string;
  impressions: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    unitText: string,
    minimumText: string,
    impressions: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.unitText = unitText;
    this.minimumText = minimumText;
    this.impressions = impressions;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPayoutNoticeView(item: RegionalPayoutNotice): RegionalPayoutNoticeView {
  return new RegionalPayoutNoticeView(
    item.code,
    item.title,
    item.unit,
    item.minimum.toFixed(2),
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPayoutNoticeViews(items: RegionalPayoutNotice[]): RegionalPayoutNoticeView[] {
  const views: RegionalPayoutNoticeView[] = [];
  for (const item of items) {
    views.push(toRegionalPayoutNoticeView(item));
  }
  return views;
}

export function sumRegionalPayoutNoticeView(view: RegionalPayoutNoticeView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedMinimum + parsedImpressions;
}
