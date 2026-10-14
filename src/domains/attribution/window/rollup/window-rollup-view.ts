import { WindowRollup } from "./window-rollup.js";

/** How screens and exports show a window rollup. */
export class WindowRollupView {
  code: string;
  labelText: string;
  timezone: string;
  maximum: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    timezone: string,
    maximum: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.timezone = timezone;
    this.maximum = maximum;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowRollupView(item: WindowRollup): WindowRollupView {
  return new WindowRollupView(
    item.code,
    item.label,
    item.timezone,
    item.maximum.toFixed(2),
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowRollupViews(items: WindowRollup[]): WindowRollupView[] {
  const views: WindowRollupView[] = [];
  for (const item of items) {
    views.push(toWindowRollupView(item));
  }
  return views;
}

export function sumWindowRollupView(view: WindowRollupView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedMaximum;
}
