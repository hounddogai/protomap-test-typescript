import * as text from "../../../../kit/text.js";
import { FallbackInsightException } from "./fallback-insight-exception.js";

/** How screens and exports show a fallback insight exception. */
export class FallbackInsightExceptionView {
  codeText: string;
  name: string;
  threshold: string;
  cost: string;
  audienceId: string;
  marginText: string;
  pinned: string;
  durationMinutes: string;
  floorValue: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    threshold: string,
    cost: string,
    audienceId: string,
    marginText: string,
    pinned: string,
    durationMinutes: string,
    floorValue: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.threshold = threshold;
    this.cost = cost;
    this.audienceId = audienceId;
    this.marginText = marginText;
    this.pinned = pinned;
    this.durationMinutes = durationMinutes;
    this.floorValue = floorValue;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackInsightExceptionView(item: FallbackInsightException): FallbackInsightExceptionView {
  return new FallbackInsightExceptionView(
    text.truncate(item.code, 40),
    item.name,
    item.threshold.toFixed(2),
    item.cost.toFixed(2),
    item.audienceId,
    item.margin.toFixed(2),
    `${item.pinned}`,
    String(item.durationMinutes),
    item.floorValue.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackInsightExceptionViews(items: FallbackInsightException[]): FallbackInsightExceptionView[] {
  const views: FallbackInsightExceptionView[] = [];
  for (const item of items) {
    views.push(toFallbackInsightExceptionView(item));
  }
  return views;
}

export function sumFallbackInsightExceptionView(view: FallbackInsightExceptionView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedThreshold + parsedCost + parsedMargin;
}
