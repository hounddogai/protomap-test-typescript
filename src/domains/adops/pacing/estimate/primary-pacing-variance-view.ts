import * as text from "../../../../kit/text.js";
import { PrimaryPacingVariance } from "./primary-pacing-variance.js";

/** How screens and exports show a primary pacing variance. */
export class PrimaryPacingVarianceView {
  codeText: string;
  name: string;
  budget: string;
  openRate: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    budget: string,
    openRate: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.budget = budget;
    this.openRate = openRate;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryPacingVarianceView(item: PrimaryPacingVariance): PrimaryPacingVarianceView {
  return new PrimaryPacingVarianceView(
    text.truncate(item.code, 120),
    item.name,
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.source,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryPacingVarianceViews(items: PrimaryPacingVariance[]): PrimaryPacingVarianceView[] {
  const views: PrimaryPacingVarianceView[] = [];
  for (const item of items) {
    views.push(toPrimaryPacingVarianceView(item));
  }
  return views;
}

export function sumPrimaryPacingVarianceView(view: PrimaryPacingVarianceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedBudget + parsedOpenRate;
}
