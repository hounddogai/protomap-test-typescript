import * as text from "../../../../kit/text.js";
import { ComplaintGroup } from "./complaint-group.js";

/** How screens and exports show a complaint group. */
export class ComplaintGroupView {
  codeText: string;
  name: string;
  durationMinutes: string;
  variant: string;
  conversionRate: string;
  visibleText: string;
  reviewer: string;
  rate: string;
  localeText: string;
  journeyId: string;
  versionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    durationMinutes: string,
    variant: string,
    conversionRate: string,
    visibleText: string,
    reviewer: string,
    rate: string,
    localeText: string,
    journeyId: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.conversionRate = conversionRate;
    this.visibleText = visibleText;
    this.reviewer = reviewer;
    this.rate = rate;
    this.localeText = localeText;
    this.journeyId = journeyId;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintGroupView(item: ComplaintGroup): ComplaintGroupView {
  return new ComplaintGroupView(
    item.code,
    item.name,
    String(item.durationMinutes),
    item.variant,
    item.conversionRate.toFixed(2),
    `${item.visible}`,
    item.reviewer,
    item.rate.toFixed(2),
    text.truncate(item.locale, 64),
    item.journeyId,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintGroupViews(items: ComplaintGroup[]): ComplaintGroupView[] {
  const views: ComplaintGroupView[] = [];
  for (const item of items) {
    views.push(toComplaintGroupView(item));
  }
  return views;
}

export function sumComplaintGroupView(view: ComplaintGroupView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedDurationMinutes + parsedConversionRate + parsedRate;
}
