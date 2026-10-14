import * as text from "../../../../kit/text.js";
import { SenderThreshold } from "./sender-threshold.js";

/** How screens and exports show a sender threshold. */
export class SenderThresholdView {
  code: string;
  title: string;
  regionText: string;
  clicks: string;
  ratioText: string;
  weightText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    regionText: string,
    clicks: string,
    ratioText: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.regionText = regionText;
    this.clicks = clicks;
    this.ratioText = ratioText;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderThresholdView(item: SenderThreshold): SenderThresholdView {
  return new SenderThresholdView(
    item.code,
    text.truncate(item.title, 120),
    item.region,
    String(item.clicks),
    item.ratio.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderThresholdViews(items: SenderThreshold[]): SenderThresholdView[] {
  const views: SenderThresholdView[] = [];
  for (const item of items) {
    views.push(toSenderThresholdView(item));
  }
  return views;
}

export function sumSenderThresholdView(view: SenderThresholdView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedClicks + parsedRatio + parsedWeight;
}
