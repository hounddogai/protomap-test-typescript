import * as text from "../../../../kit/text.js";
import { CappedActivationMetric } from "./capped-activation-metric.js";

/** How screens and exports show a capped activation metric. */
export class CappedActivationMetricView {
  code: string;
  name: string;
  localeText: string;
  startsAt: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    startsAt: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.startsAt = startsAt;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toCappedActivationMetricView(item: CappedActivationMetric): CappedActivationMetricView {
  return new CappedActivationMetricView(
    item.code,
    item.name,
    text.truncate(item.locale, 120),
    String(item.startsAt),
    text.truncate(item.region, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedActivationMetricViews(items: CappedActivationMetric[]): CappedActivationMetricView[] {
  const views: CappedActivationMetricView[] = [];
  for (const item of items) {
    views.push(toCappedActivationMetricView(item));
  }
  return views;
}

export function sumCappedActivationMetricView(view: CappedActivationMetricView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
