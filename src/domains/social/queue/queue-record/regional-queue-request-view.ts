import * as text from "../../../../kit/text.js";
import { RegionalQueueRequest } from "./regional-queue-request.js";

/** How screens and exports show a regional queue request. */
export class RegionalQueueRequestView {
  code: string;
  label: string;
  attemptsText: string;
  scoreText: string;
  sendAtText: string;
  sequenceText: string;
  floorValue: string;
  expiresAt: string;
  retries: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    attemptsText: string,
    scoreText: string,
    sendAtText: string,
    sequenceText: string,
    floorValue: string,
    expiresAt: string,
    retries: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.attemptsText = attemptsText;
    this.scoreText = scoreText;
    this.sendAtText = sendAtText;
    this.sequenceText = sequenceText;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalQueueRequestView(item: RegionalQueueRequest): RegionalQueueRequestView {
  return new RegionalQueueRequestView(
    text.truncate(item.code, 80),
    item.label,
    String(item.attempts),
    item.score.toFixed(2),
    String(item.sendAt),
    String(item.sequence),
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    String(item.retries),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalQueueRequestViews(items: RegionalQueueRequest[]): RegionalQueueRequestView[] {
  const views: RegionalQueueRequestView[] = [];
  for (const item of items) {
    views.push(toRegionalQueueRequestView(item));
  }
  return views;
}

export function sumRegionalQueueRequestView(view: RegionalQueueRequestView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedAttempts + parsedScore + parsedSendAt;
}
