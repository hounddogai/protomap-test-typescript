import { FallbackNudgeSummary } from "./fallback-nudge-summary.js";

/** How screens and exports show a fallback nudge summary. */
export class FallbackNudgeSummaryView {
  code: string;
  label: string;
  weightText: string;
  ratioText: string;
  locale: string;
  checksumText: string;
  unit: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weightText: string,
    ratioText: string,
    locale: string,
    checksumText: string,
    unit: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weightText = weightText;
    this.ratioText = ratioText;
    this.locale = locale;
    this.checksumText = checksumText;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackNudgeSummaryView(item: FallbackNudgeSummary): FallbackNudgeSummaryView {
  return new FallbackNudgeSummaryView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    item.ratio.toFixed(2),
    item.locale,
    item.checksum,
    item.unit,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackNudgeSummaryViews(items: FallbackNudgeSummary[]): FallbackNudgeSummaryView[] {
  const views: FallbackNudgeSummaryView[] = [];
  for (const item of items) {
    views.push(toFallbackNudgeSummaryView(item));
  }
  return views;
}

export function sumFallbackNudgeSummaryView(view: FallbackNudgeSummaryView): number {
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  return parsedWeight + parsedRatio;
}
