import * as text from "../../../../kit/text.js";
import { TieredModelDigest } from "./tiered-model-digest.js";

/** How screens and exports show a tiered model digest. */
export class TieredModelDigestView {
  code: string;
  labelText: string;
  utmSourceText: string;
  retries: string;
  startsAtText: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    utmSourceText: string,
    retries: string,
    startsAtText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.utmSourceText = utmSourceText;
    this.retries = retries;
    this.startsAtText = startsAtText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toTieredModelDigestView(item: TieredModelDigest): TieredModelDigestView {
  return new TieredModelDigestView(
    item.code,
    text.truncate(item.label, 64),
    item.utmSource,
    String(item.retries),
    String(item.startsAt),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredModelDigestViews(items: TieredModelDigest[]): TieredModelDigestView[] {
  const views: TieredModelDigestView[] = [];
  for (const item of items) {
    views.push(toTieredModelDigestView(item));
  }
  return views;
}

export function sumTieredModelDigestView(view: TieredModelDigestView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedRetries + parsedStartsAt + parsedRate;
}
