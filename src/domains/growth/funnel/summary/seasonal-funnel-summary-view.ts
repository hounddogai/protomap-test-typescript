import * as text from "../../../../kit/text.js";
import { SeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

/** How screens and exports show a seasonal funnel summary. */
export class SeasonalFunnelSummaryView {
  code: string;
  label: string;
  name: string;
  channel: string;
  visibleText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    name: string,
    channel: string,
    visibleText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.channel = channel;
    this.visibleText = visibleText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalFunnelSummaryView(item: SeasonalFunnelSummary): SeasonalFunnelSummaryView {
  return new SeasonalFunnelSummaryView(
    item.code,
    text.truncate(item.label, 120),
    text.truncate(item.name, 40),
    text.truncate(item.channel, 120),
    `${item.visible}`,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalFunnelSummaryViews(items: SeasonalFunnelSummary[]): SeasonalFunnelSummaryView[] {
  const views: SeasonalFunnelSummaryView[] = [];
  for (const item of items) {
    views.push(toSeasonalFunnelSummaryView(item));
  }
  return views;
}

export function sumSeasonalFunnelSummaryView(view: SeasonalFunnelSummaryView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedFloorValue;
}
