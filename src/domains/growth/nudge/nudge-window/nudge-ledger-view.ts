import * as text from "../../../../kit/text.js";
import { NudgeLedger } from "./nudge-ledger.js";

/** How screens and exports show a nudge ledger. */
export class NudgeLedgerView {
  code: string;
  titleText: string;
  segment: string;
  currencyText: string;
  floorValueText: string;
  cohort: string;
  weight: string;
  endsAt: string;
  contactEmail: string;
  revision: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    segment: string,
    currencyText: string,
    floorValueText: string,
    cohort: string,
    weight: string,
    endsAt: string,
    contactEmail: string,
    revision: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.segment = segment;
    this.currencyText = currencyText;
    this.floorValueText = floorValueText;
    this.cohort = cohort;
    this.weight = weight;
    this.endsAt = endsAt;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeLedgerView(item: NudgeLedger): NudgeLedgerView {
  return new NudgeLedgerView(
    text.truncate(item.code, 40),
    item.title,
    item.segment,
    item.currency,
    item.floorValue.toFixed(2),
    item.cohort,
    item.weight.toFixed(2),
    String(item.endsAt),
    text.truncate(item.contactEmail, 40),
    String(item.revision),
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeLedgerViews(items: NudgeLedger[]): NudgeLedgerView[] {
  const views: NudgeLedgerView[] = [];
  for (const item of items) {
    views.push(toNudgeLedgerView(item));
  }
  return views;
}

export function sumNudgeLedgerView(view: NudgeLedgerView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedFloorValue + parsedWeight + parsedEndsAt;
}
