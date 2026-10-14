import * as text from "../../../../kit/text.js";
import { TieredProofAgreement } from "./tiered-proof-agreement.js";

/** How screens and exports show a tiered proof agreement. */
export class TieredProofAgreementView {
  codeText: string;
  label: string;
  summary: string;
  utmSourceText: string;
  windowDays: string;
  limit: string;
  sequence: string;
  campaignRefText: string;
  ceiling: string;
  unit: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    summary: string,
    utmSourceText: string,
    windowDays: string,
    limit: string,
    sequence: string,
    campaignRefText: string,
    ceiling: string,
    unit: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.summary = summary;
    this.utmSourceText = utmSourceText;
    this.windowDays = windowDays;
    this.limit = limit;
    this.sequence = sequence;
    this.campaignRefText = campaignRefText;
    this.ceiling = ceiling;
    this.unit = unit;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toTieredProofAgreementView(item: TieredProofAgreement): TieredProofAgreementView {
  return new TieredProofAgreementView(
    item.code,
    text.truncate(item.label, 64),
    item.summary,
    text.truncate(item.utmSource, 64),
    String(item.windowDays),
    String(item.limit),
    String(item.sequence),
    item.campaignRef,
    item.ceiling.toFixed(2),
    text.truncate(item.unit, 40),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredProofAgreementViews(items: TieredProofAgreement[]): TieredProofAgreementView[] {
  const views: TieredProofAgreementView[] = [];
  for (const item of items) {
    views.push(toTieredProofAgreementView(item));
  }
  return views;
}

export function sumTieredProofAgreementView(view: TieredProofAgreementView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  return parsedWindowDays + parsedLimit + parsedSequence;
}
