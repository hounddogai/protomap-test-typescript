import * as text from "../../../../kit/text.js";
import { TieredFunnelSummary } from "./tiered-funnel-summary.js";

/** How screens and exports show a tiered funnel summary. */
export class TieredFunnelSummaryView {
  code: string;
  name: string;
  retries: string;
  durationMinutes: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    retries: string,
    durationMinutes: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toTieredFunnelSummaryView(item: TieredFunnelSummary): TieredFunnelSummaryView {
  return new TieredFunnelSummaryView(
    item.code,
    text.truncate(item.name, 80),
    String(item.retries),
    String(item.durationMinutes),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredFunnelSummaryViews(items: TieredFunnelSummary[]): TieredFunnelSummaryView[] {
  const views: TieredFunnelSummaryView[] = [];
  for (const item of items) {
    views.push(toTieredFunnelSummaryView(item));
  }
  return views;
}

export function sumTieredFunnelSummaryView(view: TieredFunnelSummaryView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedRetries + parsedDurationMinutes;
}
