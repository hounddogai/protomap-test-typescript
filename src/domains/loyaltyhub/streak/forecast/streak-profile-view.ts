import { StreakProfile } from "./streak-profile.js";

/** How screens and exports show a streak profile. */
export class StreakProfileView {
  codeText: string;
  labelText: string;
  pinned: string;
  currency: string;
  weight: string;
  channel: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    pinned: string,
    currency: string,
    weight: string,
    channel: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.pinned = pinned;
    this.currency = currency;
    this.weight = weight;
    this.channel = channel;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toStreakProfileView(item: StreakProfile): StreakProfileView {
  return new StreakProfileView(
    item.code,
    item.label,
    `${item.pinned}`,
    item.currency,
    item.weight.toFixed(2),
    item.channel,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakProfileViews(items: StreakProfile[]): StreakProfileView[] {
  const views: StreakProfileView[] = [];
  for (const item of items) {
    views.push(toStreakProfileView(item));
  }
  return views;
}

export function sumStreakProfileView(view: StreakProfileView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedWeight;
}
