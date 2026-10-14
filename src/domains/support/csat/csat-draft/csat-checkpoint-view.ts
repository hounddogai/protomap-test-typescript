import * as text from "../../../../kit/text.js";
import { CsatCheckpoint } from "./csat-checkpoint.js";

/** How screens and exports show a csat checkpoint. */
export class CsatCheckpointView {
  codeText: string;
  name: string;
  windowDays: string;
  campaignRef: string;
  quantity: string;
  margin: string;
  approved: string;
  rate: string;
  country: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    windowDays: string,
    campaignRef: string,
    quantity: string,
    margin: string,
    approved: string,
    rate: string,
    country: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.windowDays = windowDays;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.margin = margin;
    this.approved = approved;
    this.rate = rate;
    this.country = country;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toCsatCheckpointView(item: CsatCheckpoint): CsatCheckpointView {
  return new CsatCheckpointView(
    item.code,
    item.name,
    String(item.windowDays),
    item.campaignRef,
    String(item.quantity),
    item.margin.toFixed(2),
    `${item.approved}`,
    item.rate.toFixed(2),
    item.country,
    text.truncate(item.audienceId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatCheckpointViews(items: CsatCheckpoint[]): CsatCheckpointView[] {
  const views: CsatCheckpointView[] = [];
  for (const item of items) {
    views.push(toCsatCheckpointView(item));
  }
  return views;
}

export function sumCsatCheckpointView(view: CsatCheckpointView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedWindowDays + parsedQuantity + parsedMargin;
}
