import * as text from "../../../../kit/text.js";
import { DomainAgreement } from "./domain-agreement.js";

/** How screens and exports show a domain agreement. */
export class DomainAgreementView {
  code: string;
  name: string;
  timezone: string;
  category: string;
  summary: string;
  limit: string;
  quantity: string;
  impressionsText: string;
  startsAtText: string;
  cohort: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezone: string,
    category: string,
    summary: string,
    limit: string,
    quantity: string,
    impressionsText: string,
    startsAtText: string,
    cohort: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.category = category;
    this.summary = summary;
    this.limit = limit;
    this.quantity = quantity;
    this.impressionsText = impressionsText;
    this.startsAtText = startsAtText;
    this.cohort = cohort;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toDomainAgreementView(item: DomainAgreement): DomainAgreementView {
  return new DomainAgreementView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.timezone, 40),
    item.category,
    item.summary,
    String(item.limit),
    String(item.quantity),
    String(item.impressions),
    String(item.startsAt),
    text.truncate(item.cohort, 40),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainAgreementViews(items: DomainAgreement[]): DomainAgreementView[] {
  const views: DomainAgreementView[] = [];
  for (const item of items) {
    views.push(toDomainAgreementView(item));
  }
  return views;
}

export function sumDomainAgreementView(view: DomainAgreementView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedLimit + parsedQuantity + parsedImpressions;
}
