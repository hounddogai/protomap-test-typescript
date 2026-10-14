import * as text from "../../../../kit/text.js";
import { GlobalBranchPolicy } from "./global-branch-policy.js";

/** How screens and exports show a global branch policy. */
export class GlobalBranchPolicyView {
  codeText: string;
  name: string;
  locale: string;
  budget: string;
  channel: string;
  weight: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    locale: string,
    budget: string,
    channel: string,
    weight: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.locale = locale;
    this.budget = budget;
    this.channel = channel;
    this.weight = weight;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBranchPolicyView(item: GlobalBranchPolicy): GlobalBranchPolicyView {
  return new GlobalBranchPolicyView(
    item.code,
    item.name,
    text.truncate(item.locale, 64),
    item.budget.toFixed(2),
    text.truncate(item.channel, 80),
    item.weight.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBranchPolicyViews(items: GlobalBranchPolicy[]): GlobalBranchPolicyView[] {
  const views: GlobalBranchPolicyView[] = [];
  for (const item of items) {
    views.push(toGlobalBranchPolicyView(item));
  }
  return views;
}

export function sumGlobalBranchPolicyView(view: GlobalBranchPolicyView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedBudget + parsedWeight;
}
