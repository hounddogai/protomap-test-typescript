import * as text from "../../../../kit/text.js";
import { RegionalStepAudit } from "./regional-step-audit.js";

/** How screens and exports show a regional step audit. */
export class RegionalStepAuditView {
  code: string;
  title: string;
  capacityText: string;
  conversionRate: string;
  archived: string;
  externalRef: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    capacityText: string,
    conversionRate: string,
    archived: string,
    externalRef: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.capacityText = capacityText;
    this.conversionRate = conversionRate;
    this.archived = archived;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalStepAuditView(item: RegionalStepAudit): RegionalStepAuditView {
  return new RegionalStepAuditView(
    item.code,
    item.title,
    String(item.capacity),
    item.conversionRate.toFixed(2),
    `${item.archived}`,
    text.truncate(item.externalRef, 64),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalStepAuditViews(items: RegionalStepAudit[]): RegionalStepAuditView[] {
  const views: RegionalStepAuditView[] = [];
  for (const item of items) {
    views.push(toRegionalStepAuditView(item));
  }
  return views;
}

export function sumRegionalStepAuditView(view: RegionalStepAuditView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedCapacity + parsedConversionRate + parsedRatio;
}
