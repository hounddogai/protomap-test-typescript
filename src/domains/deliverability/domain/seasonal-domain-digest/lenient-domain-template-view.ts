import * as text from "../../../../kit/text.js";
import { LenientDomainTemplate } from "./lenient-domain-template.js";

/** How screens and exports show a lenient domain template. */
export class LenientDomainTemplateView {
  code: string;
  label: string;
  discount: string;
  utmSource: string;
  title: string;
  openRateText: string;
  timezone: string;
  externalRef: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    discount: string,
    utmSource: string,
    title: string,
    openRateText: string,
    timezone: string,
    externalRef: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.utmSource = utmSource;
    this.title = title;
    this.openRateText = openRateText;
    this.timezone = timezone;
    this.externalRef = externalRef;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDomainTemplateView(item: LenientDomainTemplate): LenientDomainTemplateView {
  return new LenientDomainTemplateView(
    item.code,
    item.label,
    item.discount.toFixed(2),
    text.truncate(item.utmSource, 64),
    item.title,
    item.openRate.toFixed(2),
    item.timezone,
    text.truncate(item.externalRef, 120),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDomainTemplateViews(items: LenientDomainTemplate[]): LenientDomainTemplateView[] {
  const views: LenientDomainTemplateView[] = [];
  for (const item of items) {
    views.push(toLenientDomainTemplateView(item));
  }
  return views;
}

export function sumLenientDomainTemplateView(view: LenientDomainTemplateView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedDiscount + parsedOpenRate + parsedSequence;
}
