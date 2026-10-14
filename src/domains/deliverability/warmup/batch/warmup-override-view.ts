import { WarmupOverride } from "./warmup-override.js";

/** How screens and exports show a warmup override. */
export class WarmupOverrideView {
  code: string;
  nameText: string;
  startsAtText: string;
  locale: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    startsAtText: string,
    locale: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.startsAtText = startsAtText;
    this.locale = locale;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toWarmupOverrideView(item: WarmupOverride): WarmupOverrideView {
  return new WarmupOverrideView(
    item.code,
    item.name,
    String(item.startsAt),
    item.locale,
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toWarmupOverrideViews(items: WarmupOverride[]): WarmupOverrideView[] {
  const views: WarmupOverrideView[] = [];
  for (const item of items) {
    views.push(toWarmupOverrideView(item));
  }
  return views;
}

export function sumWarmupOverrideView(view: WarmupOverrideView): number {
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedStartsAt;
}
