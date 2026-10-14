import { RollingPacingBatch } from "./rolling-pacing-batch.js";

/** How screens and exports show a rolling pacing batch. */
export class RollingPacingBatchView {
  code: string;
  name: string;
  timezoneText: string;
  maximum: string;
  statusLabel: string;

  constructor(code: string, name: string, timezoneText: string, maximum: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.timezoneText = timezoneText;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPacingBatchView(item: RollingPacingBatch): RollingPacingBatchView {
  return new RollingPacingBatchView(
    item.code,
    item.name,
    item.timezone,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPacingBatchViews(items: RollingPacingBatch[]): RollingPacingBatchView[] {
  const views: RollingPacingBatchView[] = [];
  for (const item of items) {
    views.push(toRollingPacingBatchView(item));
  }
  return views;
}

export function sumRollingPacingBatchView(view: RollingPacingBatchView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedMaximum;
}
