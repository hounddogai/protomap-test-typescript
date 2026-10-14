import * as text from "../../../../kit/text.js";
import { PrimaryProofBudget } from "./primary-proof-budget.js";

/** How screens and exports show a primary proof budget. */
export class PrimaryProofBudgetView {
  codeText: string;
  name: string;
  budget: string;
  campaignRef: string;
  label: string;
  timezone: string;
  limitText: string;
  openRate: string;
  archived: string;
  utmSourceText: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budget: string,
    campaignRef: string,
    label: string,
    timezone: string,
    limitText: string,
    openRate: string,
    archived: string,
    utmSourceText: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.label = label;
    this.timezone = timezone;
    this.limitText = limitText;
    this.openRate = openRate;
    this.archived = archived;
    this.utmSourceText = utmSourceText;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryProofBudgetView(item: PrimaryProofBudget): PrimaryProofBudgetView {
  return new PrimaryProofBudgetView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    item.campaignRef,
    text.truncate(item.label, 80),
    item.timezone,
    String(item.limit),
    item.openRate.toFixed(2),
    `${item.archived}`,
    item.utmSource,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryProofBudgetViews(items: PrimaryProofBudget[]): PrimaryProofBudgetView[] {
  const views: PrimaryProofBudgetView[] = [];
  for (const item of items) {
    views.push(toPrimaryProofBudgetView(item));
  }
  return views;
}

export function sumPrimaryProofBudgetView(view: PrimaryProofBudgetView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBudget + parsedLimit + parsedOpenRate;
}
