import * as text from "../../../../kit/text.js";
import { RollingPostCheckpoint } from "./rolling-post-checkpoint.js";

/** How screens and exports show a rolling post checkpoint. */
export class RollingPostCheckpointView {
  code: string;
  name: string;
  externalRefText: string;
  archivedText: string;
  discount: string;
  utmSource: string;
  phone: string;
  conversionRate: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    externalRefText: string,
    archivedText: string,
    discount: string,
    utmSource: string,
    phone: string,
    conversionRate: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.externalRefText = externalRefText;
    this.archivedText = archivedText;
    this.discount = discount;
    this.utmSource = utmSource;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPostCheckpointView(item: RollingPostCheckpoint): RollingPostCheckpointView {
  return new RollingPostCheckpointView(
    item.code,
    item.name,
    item.externalRef,
    `${item.archived}`,
    item.discount.toFixed(2),
    text.truncate(item.utmSource, 120),
    text.truncate(item.phone, 80),
    item.conversionRate.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPostCheckpointViews(items: RollingPostCheckpoint[]): RollingPostCheckpointView[] {
  const views: RollingPostCheckpointView[] = [];
  for (const item of items) {
    views.push(toRollingPostCheckpointView(item));
  }
  return views;
}

export function sumRollingPostCheckpointView(view: RollingPostCheckpointView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedDiscount + parsedConversionRate;
}
