import * as text from "../../../../kit/text.js";
import { TieredWindowException } from "./tiered-window-exception.js";

/** How screens and exports show a tiered window exception. */
export class TieredWindowExceptionView {
  codeText: string;
  title: string;
  channel: string;
  frequencyCapText: string;
  ratioText: string;
  impressionsText: string;
  source: string;
  contactEmail: string;
  maximum: string;
  minimum: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    channel: string,
    frequencyCapText: string,
    ratioText: string,
    impressionsText: string,
    source: string,
    contactEmail: string,
    maximum: string,
    minimum: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.channel = channel;
    this.frequencyCapText = frequencyCapText;
    this.ratioText = ratioText;
    this.impressionsText = impressionsText;
    this.source = source;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.minimum = minimum;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWindowExceptionView(item: TieredWindowException): TieredWindowExceptionView {
  return new TieredWindowExceptionView(
    item.code,
    text.truncate(item.title, 120),
    text.truncate(item.channel, 64),
    String(item.frequencyCap),
    item.ratio.toFixed(2),
    String(item.impressions),
    text.truncate(item.source, 64),
    item.contactEmail,
    item.maximum.toFixed(2),
    item.minimum.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWindowExceptionViews(items: TieredWindowException[]): TieredWindowExceptionView[] {
  const views: TieredWindowExceptionView[] = [];
  for (const item of items) {
    views.push(toTieredWindowExceptionView(item));
  }
  return views;
}

export function sumTieredWindowExceptionView(view: TieredWindowExceptionView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedFrequencyCap + parsedRatio + parsedImpressions;
}
