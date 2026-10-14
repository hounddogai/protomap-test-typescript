import * as text from "../../../../kit/text.js";
import { LegacyCreativeOverride } from "./legacy-creative-override.js";

/** How screens and exports show a legacy creative override. */
export class LegacyCreativeOverrideView {
  code: string;
  nameText: string;
  retriesText: string;
  maximum: string;
  region: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    retriesText: string,
    maximum: string,
    region: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.retriesText = retriesText;
    this.maximum = maximum;
    this.region = region;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyCreativeOverrideView(item: LegacyCreativeOverride): LegacyCreativeOverrideView {
  return new LegacyCreativeOverrideView(
    item.code,
    text.truncate(item.name, 120),
    String(item.retries),
    item.maximum.toFixed(2),
    text.truncate(item.region, 80),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyCreativeOverrideViews(items: LegacyCreativeOverride[]): LegacyCreativeOverrideView[] {
  const views: LegacyCreativeOverrideView[] = [];
  for (const item of items) {
    views.push(toLegacyCreativeOverrideView(item));
  }
  return views;
}

export function sumLegacyCreativeOverrideView(view: LegacyCreativeOverrideView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedRetries + parsedMaximum;
}
