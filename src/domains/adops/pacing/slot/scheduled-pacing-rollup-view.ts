import { ScheduledPacingRollup } from "./scheduled-pacing-rollup.js";

/** How screens and exports show a scheduled pacing rollup. */
export class ScheduledPacingRollupView {
  code: string;
  title: string;
  expiresAt: string;
  updatedAt: string;
  graceDays: string;
  weight: string;
  bid: string;
  endsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    expiresAt: string,
    updatedAt: string,
    graceDays: string,
    weight: string,
    bid: string,
    endsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
    this.graceDays = graceDays;
    this.weight = weight;
    this.bid = bid;
    this.endsAt = endsAt;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPacingRollupView(item: ScheduledPacingRollup): ScheduledPacingRollupView {
  return new ScheduledPacingRollupView(
    item.code,
    item.title,
    String(item.expiresAt),
    String(item.updatedAt),
    String(item.graceDays),
    item.weight.toFixed(2),
    item.bid.toFixed(2),
    String(item.endsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPacingRollupViews(items: ScheduledPacingRollup[]): ScheduledPacingRollupView[] {
  const views: ScheduledPacingRollupView[] = [];
  for (const item of items) {
    views.push(toScheduledPacingRollupView(item));
  }
  return views;
}

export function sumScheduledPacingRollupView(view: ScheduledPacingRollupView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedExpiresAt + parsedUpdatedAt + parsedGraceDays;
}
