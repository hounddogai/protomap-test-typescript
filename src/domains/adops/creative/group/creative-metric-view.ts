import * as text from "../../../../kit/text.js";
import { CreativeMetric } from "./creative-metric.js";

/** How screens and exports show a creative metric. */
export class CreativeMetricView {
  codeText: string;
  name: string;
  limitText: string;
  titleText: string;
  reviewerText: string;
  openRate: string;
  ratio: string;
  maximum: string;
  graceDaysText: string;
  startsAtText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    limitText: string,
    titleText: string,
    reviewerText: string,
    openRate: string,
    ratio: string,
    maximum: string,
    graceDaysText: string,
    startsAtText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.limitText = limitText;
    this.titleText = titleText;
    this.reviewerText = reviewerText;
    this.openRate = openRate;
    this.ratio = ratio;
    this.maximum = maximum;
    this.graceDaysText = graceDaysText;
    this.startsAtText = startsAtText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeMetricView(item: CreativeMetric): CreativeMetricView {
  return new CreativeMetricView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 64),
    String(item.limit),
    item.title,
    item.reviewer,
    item.openRate.toFixed(2),
    item.ratio.toFixed(2),
    item.maximum.toFixed(2),
    String(item.graceDays),
    String(item.startsAt),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeMetricViews(items: CreativeMetric[]): CreativeMetricView[] {
  const views: CreativeMetricView[] = [];
  for (const item of items) {
    views.push(toCreativeMetricView(item));
  }
  return views;
}

export function sumCreativeMetricView(view: CreativeMetricView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedLimit + parsedOpenRate + parsedRatio;
}
