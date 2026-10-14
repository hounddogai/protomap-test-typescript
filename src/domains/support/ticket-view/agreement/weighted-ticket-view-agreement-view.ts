import * as text from "../../../../kit/text.js";
import { WeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

/** How screens and exports show a weighted ticket view agreement. */
export class WeightedTicketViewAgreementView {
  codeText: string;
  title: string;
  ratio: string;
  cohort: string;
  amount: string;
  channelText: string;
  budget: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    ratio: string,
    cohort: string,
    amount: string,
    channelText: string,
    budget: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.ratio = ratio;
    this.cohort = cohort;
    this.amount = amount;
    this.channelText = channelText;
    this.budget = budget;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedTicketViewAgreementView(item: WeightedTicketViewAgreement): WeightedTicketViewAgreementView {
  return new WeightedTicketViewAgreementView(
    text.truncate(item.code, 120),
    item.title,
    item.ratio.toFixed(2),
    text.truncate(item.cohort, 64),
    item.amount.toFixed(2),
    text.truncate(item.channel, 40),
    item.budget.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedTicketViewAgreementViews(items: WeightedTicketViewAgreement[]): WeightedTicketViewAgreementView[] {
  const views: WeightedTicketViewAgreementView[] = [];
  for (const item of items) {
    views.push(toWeightedTicketViewAgreementView(item));
  }
  return views;
}

export function sumWeightedTicketViewAgreementView(view: WeightedTicketViewAgreementView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedRatio + parsedAmount + parsedBudget;
}
