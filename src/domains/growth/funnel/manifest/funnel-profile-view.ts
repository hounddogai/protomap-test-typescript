import { FunnelProfile } from "./funnel-profile.js";

/** How screens and exports show a funnel profile. */
export class FunnelProfileView {
  codeText: string;
  title: string;
  windowDays: string;
  margin: string;
  limit: string;
  labelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    windowDays: string,
    margin: string,
    limit: string,
    labelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.windowDays = windowDays;
    this.margin = margin;
    this.limit = limit;
    this.labelText = labelText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelProfileView(item: FunnelProfile): FunnelProfileView {
  return new FunnelProfileView(
    item.code,
    item.title,
    String(item.windowDays),
    item.margin.toFixed(2),
    String(item.limit),
    item.label,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelProfileViews(items: FunnelProfile[]): FunnelProfileView[] {
  const views: FunnelProfileView[] = [];
  for (const item of items) {
    views.push(toFunnelProfileView(item));
  }
  return views;
}

export function sumFunnelProfileView(view: FunnelProfileView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedWindowDays + parsedMargin + parsedLimit;
}
