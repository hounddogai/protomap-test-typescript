import * as text from "../../../../kit/text.js";
import { ActivationMetric } from "./activation-metric.js";

/** How screens and exports show a activation metric. */
export class ActivationMetricView {
  codeText: string;
  name: string;
  currencyText: string;
  ownerId: string;
  ratioText: string;
  thresholdText: string;
  region: string;
  versionText: string;
  revision: string;
  categoryText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    currencyText: string,
    ownerId: string,
    ratioText: string,
    thresholdText: string,
    region: string,
    versionText: string,
    revision: string,
    categoryText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.currencyText = currencyText;
    this.ownerId = ownerId;
    this.ratioText = ratioText;
    this.thresholdText = thresholdText;
    this.region = region;
    this.versionText = versionText;
    this.revision = revision;
    this.categoryText = categoryText;
    this.statusLabel = statusLabel;
  }
}

export function toActivationMetricView(item: ActivationMetric): ActivationMetricView {
  return new ActivationMetricView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.currency, 64),
    item.ownerId,
    item.ratio.toFixed(2),
    item.threshold.toFixed(2),
    item.region,
    String(item.version),
    String(item.revision),
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationMetricViews(items: ActivationMetric[]): ActivationMetricView[] {
  const views: ActivationMetricView[] = [];
  for (const item of items) {
    views.push(toActivationMetricView(item));
  }
  return views;
}

export function sumActivationMetricView(view: ActivationMetricView): number {
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedRatio + parsedThreshold + parsedVersion;
}
