import * as text from "../../../../kit/text.js";
import { WeightedSenderException } from "./weighted-sender-exception.js";

/** How screens and exports show a weighted sender exception. */
export class WeightedSenderExceptionView {
  codeText: string;
  labelText: string;
  limitText: string;
  startsAtText: string;
  margin: string;
  frequencyCap: string;
  channel: string;
  budget: string;
  windowDays: string;
  summary: string;
  batchSizeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    limitText: string,
    startsAtText: string,
    margin: string,
    frequencyCap: string,
    channel: string,
    budget: string,
    windowDays: string,
    summary: string,
    batchSizeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.limitText = limitText;
    this.startsAtText = startsAtText;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.budget = budget;
    this.windowDays = windowDays;
    this.summary = summary;
    this.batchSizeText = batchSizeText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedSenderExceptionView(item: WeightedSenderException): WeightedSenderExceptionView {
  return new WeightedSenderExceptionView(
    item.code,
    item.label,
    String(item.limit),
    String(item.startsAt),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    text.truncate(item.channel, 40),
    item.budget.toFixed(2),
    String(item.windowDays),
    item.summary,
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedSenderExceptionViews(items: WeightedSenderException[]): WeightedSenderExceptionView[] {
  const views: WeightedSenderExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedSenderExceptionView(item));
  }
  return views;
}

export function sumWeightedSenderExceptionView(view: WeightedSenderExceptionView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedLimit + parsedStartsAt + parsedMargin;
}
