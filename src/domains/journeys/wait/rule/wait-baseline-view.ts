import * as text from "../../../../kit/text.js";
import { WaitBaseline } from "./wait-baseline.js";

/** How screens and exports show a wait baseline. */
export class WaitBaselineView {
  code: string;
  label: string;
  cost: string;
  active: string;
  ratio: string;
  expiresAtText: string;
  timezone: string;
  audienceId: string;
  utmSourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    active: string,
    ratio: string,
    expiresAtText: string,
    timezone: string,
    audienceId: string,
    utmSourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.active = active;
    this.ratio = ratio;
    this.expiresAtText = expiresAtText;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.utmSourceText = utmSourceText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitBaselineView(item: WaitBaseline): WaitBaselineView {
  return new WaitBaselineView(
    text.truncate(item.code, 80),
    item.label,
    item.cost.toFixed(2),
    `${item.active}`,
    item.ratio.toFixed(2),
    String(item.expiresAt),
    item.timezone,
    item.audienceId,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitBaselineViews(items: WaitBaseline[]): WaitBaselineView[] {
  const views: WaitBaselineView[] = [];
  for (const item of items) {
    views.push(toWaitBaselineView(item));
  }
  return views;
}

export function sumWaitBaselineView(view: WaitBaselineView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedCost + parsedRatio + parsedExpiresAt;
}
