import { FunnelEntry } from "./funnel-entry.js";

/** How screens and exports show a funnel entry. */
export class FunnelEntryView {
  code: string;
  label: string;
  weight: string;
  locale: string;
  threshold: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    weight: string,
    locale: string,
    threshold: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.locale = locale;
    this.threshold = threshold;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelEntryView(item: FunnelEntry): FunnelEntryView {
  return new FunnelEntryView(
    item.code,
    item.label,
    item.weight.toFixed(2),
    item.locale,
    item.threshold.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelEntryViews(items: FunnelEntry[]): FunnelEntryView[] {
  const views: FunnelEntryView[] = [];
  for (const item of items) {
    views.push(toFunnelEntryView(item));
  }
  return views;
}

export function sumFunnelEntryView(view: FunnelEntryView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedWeight + parsedThreshold + parsedStartsAt;
}
