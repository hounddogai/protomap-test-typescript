import * as text from "../../../../kit/text.js";
import { EscalationTier } from "./escalation-tier.js";

/** How screens and exports show a escalation tier. */
export class EscalationTierView {
  code: string;
  name: string;
  budget: string;
  visible: string;
  approved: string;
  journeyIdText: string;
  amount: string;
  reviewerText: string;
  audienceIdText: string;
  description: string;
  revision: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    budget: string,
    visible: string,
    approved: string,
    journeyIdText: string,
    amount: string,
    reviewerText: string,
    audienceIdText: string,
    description: string,
    revision: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.visible = visible;
    this.approved = approved;
    this.journeyIdText = journeyIdText;
    this.amount = amount;
    this.reviewerText = reviewerText;
    this.audienceIdText = audienceIdText;
    this.description = description;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationTierView(item: EscalationTier): EscalationTierView {
  return new EscalationTierView(
    item.code,
    item.name,
    item.budget.toFixed(2),
    `${item.visible}`,
    `${item.approved}`,
    text.truncate(item.journeyId, 80),
    item.amount.toFixed(2),
    text.truncate(item.reviewer, 80),
    item.audienceId,
    item.description,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationTierViews(items: EscalationTier[]): EscalationTierView[] {
  const views: EscalationTierView[] = [];
  for (const item of items) {
    views.push(toEscalationTierView(item));
  }
  return views;
}

export function sumEscalationTierView(view: EscalationTierView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBudget + parsedAmount + parsedRevision;
}
