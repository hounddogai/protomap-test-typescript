import { TieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

/** How screens and exports show a tiered sla checkpoint. */
export class TieredSlaCheckpointView {
  code: string;
  title: string;
  rateText: string;
  openRateText: string;
  statusLabel: string;

  constructor(code: string, title: string, rateText: string, openRateText: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.rateText = rateText;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredSlaCheckpointView(item: TieredSlaCheckpoint): TieredSlaCheckpointView {
  return new TieredSlaCheckpointView(
    item.code,
    item.title,
    item.rate.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredSlaCheckpointViews(items: TieredSlaCheckpoint[]): TieredSlaCheckpointView[] {
  const views: TieredSlaCheckpointView[] = [];
  for (const item of items) {
    views.push(toTieredSlaCheckpointView(item));
  }
  return views;
}

export function sumTieredSlaCheckpointView(view: TieredSlaCheckpointView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedRate + parsedOpenRate;
}
