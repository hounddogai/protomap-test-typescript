import * as text from "../../../../kit/text.js";
import { LenientCreditProposal } from "./lenient-credit-proposal.js";

/** How screens and exports show a lenient credit proposal. */
export class LenientCreditProposalView {
  code: string;
  title: string;
  frequencyCapText: string;
  cohort: string;
  openRate: string;
  segment: string;
  categoryText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    frequencyCapText: string,
    cohort: string,
    openRate: string,
    segment: string,
    categoryText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCapText = frequencyCapText;
    this.cohort = cohort;
    this.openRate = openRate;
    this.segment = segment;
    this.categoryText = categoryText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCreditProposalView(item: LenientCreditProposal): LenientCreditProposalView {
  return new LenientCreditProposalView(
    text.truncate(item.code, 80),
    item.title,
    String(item.frequencyCap),
    text.truncate(item.cohort, 40),
    item.openRate.toFixed(2),
    item.segment,
    item.category,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCreditProposalViews(items: LenientCreditProposal[]): LenientCreditProposalView[] {
  const views: LenientCreditProposalView[] = [];
  for (const item of items) {
    views.push(toLenientCreditProposalView(item));
  }
  return views;
}

export function sumLenientCreditProposalView(view: LenientCreditProposalView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedFrequencyCap + parsedOpenRate + parsedAmount;
}
