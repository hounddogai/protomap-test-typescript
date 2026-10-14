import * as text from "../../../../kit/text.js";
import { EnrollmentAudit } from "./enrollment-audit.js";

/** How screens and exports show a enrollment audit. */
export class EnrollmentAuditView {
  code: string;
  name: string;
  ownerId: string;
  conversionRate: string;
  maximumText: string;
  margin: string;
  sequence: string;
  notes: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    conversionRate: string,
    maximumText: string,
    margin: string,
    sequence: string,
    notes: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.conversionRate = conversionRate;
    this.maximumText = maximumText;
    this.margin = margin;
    this.sequence = sequence;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentAuditView(item: EnrollmentAudit): EnrollmentAuditView {
  return new EnrollmentAuditView(
    text.truncate(item.code, 120),
    item.name,
    item.ownerId,
    item.conversionRate.toFixed(2),
    item.maximum.toFixed(2),
    item.margin.toFixed(2),
    String(item.sequence),
    text.truncate(item.notes, 64),
    text.truncate(item.campaignRef, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentAuditViews(items: EnrollmentAudit[]): EnrollmentAuditView[] {
  const views: EnrollmentAuditView[] = [];
  for (const item of items) {
    views.push(toEnrollmentAuditView(item));
  }
  return views;
}

export function sumEnrollmentAuditView(view: EnrollmentAuditView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedConversionRate + parsedMaximum + parsedMargin;
}
