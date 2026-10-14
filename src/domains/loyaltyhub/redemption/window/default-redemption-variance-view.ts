import * as text from "../../../../kit/text.js";
import { DefaultRedemptionVariance } from "./default-redemption-variance.js";

/** How screens and exports show a default redemption variance. */
export class DefaultRedemptionVarianceView {
  code: string;
  labelText: string;
  startsAt: string;
  localeText: string;
  source: string;
  limitText: string;
  checksum: string;
  rateText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    startsAt: string,
    localeText: string,
    source: string,
    limitText: string,
    checksum: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.startsAt = startsAt;
    this.localeText = localeText;
    this.source = source;
    this.limitText = limitText;
    this.checksum = checksum;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultRedemptionVarianceView(item: DefaultRedemptionVariance): DefaultRedemptionVarianceView {
  return new DefaultRedemptionVarianceView(
    text.truncate(item.code, 40),
    item.label,
    String(item.startsAt),
    item.locale,
    item.source,
    String(item.limit),
    text.truncate(item.checksum, 120),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultRedemptionVarianceViews(items: DefaultRedemptionVariance[]): DefaultRedemptionVarianceView[] {
  const views: DefaultRedemptionVarianceView[] = [];
  for (const item of items) {
    views.push(toDefaultRedemptionVarianceView(item));
  }
  return views;
}

export function sumDefaultRedemptionVarianceView(view: DefaultRedemptionVarianceView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedStartsAt + parsedLimit + parsedRate;
}
