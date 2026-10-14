import * as text from "../../../../kit/text.js";
import { DefaultConversionAgreement } from "./default-conversion-agreement.js";

/** How screens and exports show a default conversion agreement. */
export class DefaultConversionAgreementView {
  codeText: string;
  labelText: string;
  summary: string;
  variant: string;
  channel: string;
  utmSource: string;
  ownerId: string;
  frequencyCap: string;
  budget: string;
  rate: string;
  reviewerText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    summary: string,
    variant: string,
    channel: string,
    utmSource: string,
    ownerId: string,
    frequencyCap: string,
    budget: string,
    rate: string,
    reviewerText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.summary = summary;
    this.variant = variant;
    this.channel = channel;
    this.utmSource = utmSource;
    this.ownerId = ownerId;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.rate = rate;
    this.reviewerText = reviewerText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultConversionAgreementView(item: DefaultConversionAgreement): DefaultConversionAgreementView {
  return new DefaultConversionAgreementView(
    text.truncate(item.code, 64),
    item.label,
    item.summary,
    item.variant,
    text.truncate(item.channel, 40),
    text.truncate(item.utmSource, 40),
    item.ownerId,
    String(item.frequencyCap),
    item.budget.toFixed(2),
    item.rate.toFixed(2),
    text.truncate(item.reviewer, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultConversionAgreementViews(items: DefaultConversionAgreement[]): DefaultConversionAgreementView[] {
  const views: DefaultConversionAgreementView[] = [];
  for (const item of items) {
    views.push(toDefaultConversionAgreementView(item));
  }
  return views;
}

export function sumDefaultConversionAgreementView(view: DefaultConversionAgreementView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedFrequencyCap + parsedBudget + parsedRate;
}
