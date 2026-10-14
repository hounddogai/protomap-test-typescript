import * as text from "../../../../kit/text.js";
import { NudgeBaseline } from "./nudge-baseline.js";

/** How screens and exports show a nudge baseline. */
export class NudgeBaselineView {
  code: string;
  title: string;
  marginText: string;
  minimumText: string;
  floorValue: string;
  amount: string;
  sendAt: string;
  weight: string;
  revision: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    marginText: string,
    minimumText: string,
    floorValue: string,
    amount: string,
    sendAt: string,
    weight: string,
    revision: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.marginText = marginText;
    this.minimumText = minimumText;
    this.floorValue = floorValue;
    this.amount = amount;
    this.sendAt = sendAt;
    this.weight = weight;
    this.revision = revision;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeBaselineView(item: NudgeBaseline): NudgeBaselineView {
  return new NudgeBaselineView(
    item.code,
    item.title,
    item.margin.toFixed(2),
    item.minimum.toFixed(2),
    item.floorValue.toFixed(2),
    item.amount.toFixed(2),
    String(item.sendAt),
    item.weight.toFixed(2),
    String(item.revision),
    text.truncate(item.region, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeBaselineViews(items: NudgeBaseline[]): NudgeBaselineView[] {
  const views: NudgeBaselineView[] = [];
  for (const item of items) {
    views.push(toNudgeBaselineView(item));
  }
  return views;
}

export function sumNudgeBaselineView(view: NudgeBaselineView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedMargin + parsedMinimum + parsedFloorValue;
}
