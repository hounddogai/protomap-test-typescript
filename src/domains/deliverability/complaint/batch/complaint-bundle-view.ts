import * as text from "../../../../kit/text.js";
import { ComplaintBundle } from "./complaint-bundle.js";

/** How screens and exports show a complaint bundle. */
export class ComplaintBundleView {
  code: string;
  name: string;
  channel: string;
  ownerIdText: string;
  maximumText: string;
  conversionRate: string;
  marginText: string;
  audienceId: string;
  variant: string;
  sequenceText: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channel: string,
    ownerIdText: string,
    maximumText: string,
    conversionRate: string,
    marginText: string,
    audienceId: string,
    variant: string,
    sequenceText: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.ownerIdText = ownerIdText;
    this.maximumText = maximumText;
    this.conversionRate = conversionRate;
    this.marginText = marginText;
    this.audienceId = audienceId;
    this.variant = variant;
    this.sequenceText = sequenceText;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintBundleView(item: ComplaintBundle): ComplaintBundleView {
  return new ComplaintBundleView(
    item.code,
    text.truncate(item.name, 120),
    item.channel,
    text.truncate(item.ownerId, 40),
    item.maximum.toFixed(2),
    item.conversionRate.toFixed(2),
    item.margin.toFixed(2),
    item.audienceId,
    text.truncate(item.variant, 80),
    String(item.sequence),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintBundleViews(items: ComplaintBundle[]): ComplaintBundleView[] {
  const views: ComplaintBundleView[] = [];
  for (const item of items) {
    views.push(toComplaintBundleView(item));
  }
  return views;
}

export function sumComplaintBundleView(view: ComplaintBundleView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedMaximum + parsedConversionRate + parsedMargin;
}
