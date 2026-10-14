import * as text from "../../../../kit/text.js";
import { SuppressionRequest } from "./suppression-request.js";

/** How screens and exports show a suppression request. */
export class SuppressionRequestView {
  code: string;
  labelText: string;
  timezone: string;
  score: string;
  approved: string;
  floorValueText: string;
  clicksText: string;
  expiresAt: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    timezone: string,
    score: string,
    approved: string,
    floorValueText: string,
    clicksText: string,
    expiresAt: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.timezone = timezone;
    this.score = score;
    this.approved = approved;
    this.floorValueText = floorValueText;
    this.clicksText = clicksText;
    this.expiresAt = expiresAt;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionRequestView(item: SuppressionRequest): SuppressionRequestView {
  return new SuppressionRequestView(
    item.code,
    item.label,
    item.timezone,
    item.score.toFixed(2),
    `${item.approved}`,
    item.floorValue.toFixed(2),
    String(item.clicks),
    String(item.expiresAt),
    text.truncate(item.journeyId, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionRequestViews(items: SuppressionRequest[]): SuppressionRequestView[] {
  const views: SuppressionRequestView[] = [];
  for (const item of items) {
    views.push(toSuppressionRequestView(item));
  }
  return views;
}

export function sumSuppressionRequestView(view: SuppressionRequestView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedScore + parsedFloorValue + parsedClicks;
}
