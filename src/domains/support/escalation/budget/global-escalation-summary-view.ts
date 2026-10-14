import { GlobalEscalationSummary } from "./global-escalation-summary.js";

/** How screens and exports show a global escalation summary. */
export class GlobalEscalationSummaryView {
  codeText: string;
  name: string;
  cost: string;
  budgetText: string;
  region: string;
  revision: string;
  impressionsText: string;
  currencyText: string;
  ratio: string;
  attempts: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    cost: string,
    budgetText: string,
    region: string,
    revision: string,
    impressionsText: string,
    currencyText: string,
    ratio: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.cost = cost;
    this.budgetText = budgetText;
    this.region = region;
    this.revision = revision;
    this.impressionsText = impressionsText;
    this.currencyText = currencyText;
    this.ratio = ratio;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalEscalationSummaryView(item: GlobalEscalationSummary): GlobalEscalationSummaryView {
  return new GlobalEscalationSummaryView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    item.region,
    String(item.revision),
    String(item.impressions),
    item.currency,
    item.ratio.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalEscalationSummaryViews(items: GlobalEscalationSummary[]): GlobalEscalationSummaryView[] {
  const views: GlobalEscalationSummaryView[] = [];
  for (const item of items) {
    views.push(toGlobalEscalationSummaryView(item));
  }
  return views;
}

export function sumGlobalEscalationSummaryView(view: GlobalEscalationSummaryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedCost + parsedBudget + parsedRevision;
}
