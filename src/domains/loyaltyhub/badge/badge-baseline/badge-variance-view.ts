import * as text from "../../../../kit/text.js";
import { BadgeVariance } from "./badge-variance.js";

/** How screens and exports show a badge variance. */
export class BadgeVarianceView {
  code: string;
  nameText: string;
  conversionRateText: string;
  impressionsText: string;
  audienceId: string;
  visible: string;
  title: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    conversionRateText: string,
    impressionsText: string,
    audienceId: string,
    visible: string,
    title: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.conversionRateText = conversionRateText;
    this.impressionsText = impressionsText;
    this.audienceId = audienceId;
    this.visible = visible;
    this.title = title;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toBadgeVarianceView(item: BadgeVariance): BadgeVarianceView {
  return new BadgeVarianceView(
    text.truncate(item.code, 80),
    item.name,
    item.conversionRate.toFixed(2),
    String(item.impressions),
    text.truncate(item.audienceId, 40),
    `${item.visible}`,
    text.truncate(item.title, 40),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toBadgeVarianceViews(items: BadgeVariance[]): BadgeVarianceView[] {
  const views: BadgeVarianceView[] = [];
  for (const item of items) {
    views.push(toBadgeVarianceView(item));
  }
  return views;
}

export function sumBadgeVarianceView(view: BadgeVarianceView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedConversionRate + parsedImpressions;
}
