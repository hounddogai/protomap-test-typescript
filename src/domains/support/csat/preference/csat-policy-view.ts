import * as text from "../../../../kit/text.js";
import { CsatPolicy } from "./csat-policy.js";

/** How screens and exports show a csat policy. */
export class CsatPolicyView {
  code: string;
  titleText: string;
  retries: string;
  region: string;
  cohortText: string;
  journeyId: string;
  currency: string;
  ceiling: string;
  labelText: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    retries: string,
    region: string,
    cohortText: string,
    journeyId: string,
    currency: string,
    ceiling: string,
    labelText: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.retries = retries;
    this.region = region;
    this.cohortText = cohortText;
    this.journeyId = journeyId;
    this.currency = currency;
    this.ceiling = ceiling;
    this.labelText = labelText;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toCsatPolicyView(item: CsatPolicy): CsatPolicyView {
  return new CsatPolicyView(
    item.code,
    item.title,
    String(item.retries),
    text.truncate(item.region, 64),
    item.cohort,
    text.truncate(item.journeyId, 40),
    text.truncate(item.currency, 40),
    item.ceiling.toFixed(2),
    text.truncate(item.label, 120),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatPolicyViews(items: CsatPolicy[]): CsatPolicyView[] {
  const views: CsatPolicyView[] = [];
  for (const item of items) {
    views.push(toCsatPolicyView(item));
  }
  return views;
}

export function sumCsatPolicyView(view: CsatPolicyView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  return parsedRetries + parsedCeiling + parsedAttempts;
}
