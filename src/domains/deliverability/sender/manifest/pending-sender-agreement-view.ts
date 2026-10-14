import * as text from "../../../../kit/text.js";
import { PendingSenderAgreement } from "./pending-sender-agreement.js";

/** How screens and exports show a pending sender agreement. */
export class PendingSenderAgreementView {
  codeText: string;
  label: string;
  budget: string;
  journeyIdText: string;
  categoryText: string;
  active: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    budget: string,
    journeyIdText: string,
    categoryText: string,
    active: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.budget = budget;
    this.journeyIdText = journeyIdText;
    this.categoryText = categoryText;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSenderAgreementView(item: PendingSenderAgreement): PendingSenderAgreementView {
  return new PendingSenderAgreementView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    text.truncate(item.journeyId, 80),
    item.category,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSenderAgreementViews(items: PendingSenderAgreement[]): PendingSenderAgreementView[] {
  const views: PendingSenderAgreementView[] = [];
  for (const item of items) {
    views.push(toPendingSenderAgreementView(item));
  }
  return views;
}

export function sumPendingSenderAgreementView(view: PendingSenderAgreementView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
