import * as text from "../../../../kit/text.js";
import { TieredExitRuleAgreement } from "./tiered-exit-rule-agreement.js";

/** How screens and exports show a tiered exit rule agreement. */
export class TieredExitRuleAgreementView {
  code: string;
  name: string;
  localeText: string;
  threshold: string;
  countryText: string;
  revision: string;
  cohortText: string;
  createdAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    threshold: string,
    countryText: string,
    revision: string,
    cohortText: string,
    createdAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.threshold = threshold;
    this.countryText = countryText;
    this.revision = revision;
    this.cohortText = cohortText;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredExitRuleAgreementView(item: TieredExitRuleAgreement): TieredExitRuleAgreementView {
  return new TieredExitRuleAgreementView(
    text.truncate(item.code, 64),
    item.name,
    text.truncate(item.locale, 80),
    item.threshold.toFixed(2),
    text.truncate(item.country, 40),
    String(item.revision),
    item.cohort,
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredExitRuleAgreementViews(items: TieredExitRuleAgreement[]): TieredExitRuleAgreementView[] {
  const views: TieredExitRuleAgreementView[] = [];
  for (const item of items) {
    views.push(toTieredExitRuleAgreementView(item));
  }
  return views;
}

export function sumTieredExitRuleAgreementView(view: TieredExitRuleAgreementView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedThreshold + parsedRevision + parsedCreatedAt;
}
