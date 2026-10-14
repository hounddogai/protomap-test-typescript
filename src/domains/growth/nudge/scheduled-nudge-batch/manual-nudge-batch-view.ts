import * as text from "../../../../kit/text.js";
import { ManualNudgeBatch } from "./manual-nudge-batch.js";

/** How screens and exports show a manual nudge batch. */
export class ManualNudgeBatchView {
  code: string;
  label: string;
  timezone: string;
  ceilingText: string;
  country: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezone: string,
    ceilingText: string,
    country: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.ceilingText = ceilingText;
    this.country = country;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toManualNudgeBatchView(item: ManualNudgeBatch): ManualNudgeBatchView {
  return new ManualNudgeBatchView(
    text.truncate(item.code, 64),
    item.label,
    item.timezone,
    item.ceiling.toFixed(2),
    item.country,
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualNudgeBatchViews(items: ManualNudgeBatch[]): ManualNudgeBatchView[] {
  const views: ManualNudgeBatchView[] = [];
  for (const item of items) {
    views.push(toManualNudgeBatchView(item));
  }
  return views;
}

export function sumManualNudgeBatchView(view: ManualNudgeBatchView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCeiling;
}
