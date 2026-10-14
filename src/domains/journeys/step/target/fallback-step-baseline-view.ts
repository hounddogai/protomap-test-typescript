import * as text from "../../../../kit/text.js";
import { FallbackStepBaseline } from "./fallback-step-baseline.js";

/** How screens and exports show a fallback step baseline. */
export class FallbackStepBaselineView {
  code: string;
  label: string;
  checksum: string;
  audienceIdText: string;
  unit: string;
  startsAt: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    checksum: string,
    audienceIdText: string,
    unit: string,
    startsAt: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.audienceIdText = audienceIdText;
    this.unit = unit;
    this.startsAt = startsAt;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackStepBaselineView(item: FallbackStepBaseline): FallbackStepBaselineView {
  return new FallbackStepBaselineView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    item.checksum,
    item.audienceId,
    item.unit,
    String(item.startsAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackStepBaselineViews(items: FallbackStepBaseline[]): FallbackStepBaselineView[] {
  const views: FallbackStepBaselineView[] = [];
  for (const item of items) {
    views.push(toFallbackStepBaselineView(item));
  }
  return views;
}

export function sumFallbackStepBaselineView(view: FallbackStepBaselineView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedStartsAt + parsedOpenRate;
}
