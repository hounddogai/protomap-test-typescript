import { ProofTier } from "./proof-tier.js";

/** How screens and exports show a proof tier. */
export class ProofTierView {
  code: string;
  title: string;
  activeText: string;
  budgetText: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    activeText: string,
    budgetText: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.activeText = activeText;
    this.budgetText = budgetText;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toProofTierView(item: ProofTier): ProofTierView {
  return new ProofTierView(
    item.code,
    item.title,
    `${item.active}`,
    item.budget.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofTierViews(items: ProofTier[]): ProofTierView[] {
  const views: ProofTierView[] = [];
  for (const item of items) {
    views.push(toProofTierView(item));
  }
  return views;
}

export function sumProofTierView(view: ProofTierView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedBudget + parsedCost;
}
