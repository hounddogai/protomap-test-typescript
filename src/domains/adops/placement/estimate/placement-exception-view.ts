import * as text from "../../../../kit/text.js";
import { PlacementException } from "./placement-exception.js";

/** How screens and exports show a placement exception. */
export class PlacementExceptionView {
  code: string;
  label: string;
  rateText: string;
  sendAt: string;
  margin: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rateText: string,
    sendAt: string,
    margin: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rateText = rateText;
    this.sendAt = sendAt;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementExceptionView(item: PlacementException): PlacementExceptionView {
  return new PlacementExceptionView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 40),
    item.rate.toFixed(2),
    String(item.sendAt),
    item.margin.toFixed(2),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementExceptionViews(items: PlacementException[]): PlacementExceptionView[] {
  const views: PlacementExceptionView[] = [];
  for (const item of items) {
    views.push(toPlacementExceptionView(item));
  }
  return views;
}

export function sumPlacementExceptionView(view: PlacementExceptionView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedRate + parsedSendAt + parsedMargin;
}
