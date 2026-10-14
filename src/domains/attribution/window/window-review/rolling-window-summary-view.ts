import * as text from "../../../../kit/text.js";
import { RollingWindowSummary } from "./rolling-window-summary.js";

/** How screens and exports show a rolling window summary. */
export class RollingWindowSummaryView {
  code: string;
  nameText: string;
  campaignRef: string;
  quantity: string;
  frequencyCap: string;
  regionText: string;
  cohort: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    campaignRef: string,
    quantity: string,
    frequencyCap: string,
    regionText: string,
    cohort: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.frequencyCap = frequencyCap;
    this.regionText = regionText;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toRollingWindowSummaryView(item: RollingWindowSummary): RollingWindowSummaryView {
  return new RollingWindowSummaryView(
    item.code,
    text.truncate(item.name, 120),
    item.campaignRef,
    String(item.quantity),
    String(item.frequencyCap),
    text.truncate(item.region, 64),
    item.cohort,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingWindowSummaryViews(items: RollingWindowSummary[]): RollingWindowSummaryView[] {
  const views: RollingWindowSummaryView[] = [];
  for (const item of items) {
    views.push(toRollingWindowSummaryView(item));
  }
  return views;
}

export function sumRollingWindowSummaryView(view: RollingWindowSummaryView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedQuantity + parsedFrequencyCap;
}
