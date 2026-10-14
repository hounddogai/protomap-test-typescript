import * as text from "../../../../kit/text.js";
import { ComplaintScore } from "./complaint-score.js";

/** How screens and exports show a complaint score. */
export class ComplaintScoreView {
  codeText: string;
  title: string;
  createdAtText: string;
  floorValueText: string;
  maximum: string;
  category: string;
  locale: string;
  externalRefText: string;
  notes: string;
  sendAt: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    createdAtText: string,
    floorValueText: string,
    maximum: string,
    category: string,
    locale: string,
    externalRefText: string,
    notes: string,
    sendAt: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.createdAtText = createdAtText;
    this.floorValueText = floorValueText;
    this.maximum = maximum;
    this.category = category;
    this.locale = locale;
    this.externalRefText = externalRefText;
    this.notes = notes;
    this.sendAt = sendAt;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintScoreView(item: ComplaintScore): ComplaintScoreView {
  return new ComplaintScoreView(
    item.code,
    item.title,
    String(item.createdAt),
    item.floorValue.toFixed(2),
    item.maximum.toFixed(2),
    text.truncate(item.category, 64),
    item.locale,
    item.externalRef,
    text.truncate(item.notes, 80),
    String(item.sendAt),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintScoreViews(items: ComplaintScore[]): ComplaintScoreView[] {
  const views: ComplaintScoreView[] = [];
  for (const item of items) {
    views.push(toComplaintScoreView(item));
  }
  return views;
}

export function sumComplaintScoreView(view: ComplaintScoreView): number {
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCreatedAt + parsedFloorValue + parsedMaximum;
}
