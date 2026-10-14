import * as text from "../../../../kit/text.js";
import { OptOutDigest } from "./opt-out-digest.js";

/** How screens and exports show a opt out digest. */
export class OptOutDigestView {
  code: string;
  label: string;
  minimum: string;
  ownerId: string;
  archived: string;
  margin: string;
  conversionRate: string;
  phoneText: string;
  channelText: string;
  openRate: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    ownerId: string,
    archived: string,
    margin: string,
    conversionRate: string,
    phoneText: string,
    channelText: string,
    openRate: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.ownerId = ownerId;
    this.archived = archived;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.phoneText = phoneText;
    this.channelText = channelText;
    this.openRate = openRate;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutDigestView(item: OptOutDigest): OptOutDigestView {
  return new OptOutDigestView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 120),
    item.minimum.toFixed(2),
    text.truncate(item.ownerId, 64),
    `${item.archived}`,
    item.margin.toFixed(2),
    item.conversionRate.toFixed(2),
    item.phone,
    item.channel,
    item.openRate.toFixed(2),
    text.truncate(item.title, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutDigestViews(items: OptOutDigest[]): OptOutDigestView[] {
  const views: OptOutDigestView[] = [];
  for (const item of items) {
    views.push(toOptOutDigestView(item));
  }
  return views;
}

export function sumOptOutDigestView(view: OptOutDigestView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedMinimum + parsedMargin + parsedConversionRate;
}
