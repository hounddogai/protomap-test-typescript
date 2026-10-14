import * as text from "../../../../kit/text.js";
import { FlightProposal } from "./flight-proposal.js";

/** How screens and exports show a flight proposal. */
export class FlightProposalView {
  code: string;
  label: string;
  localeText: string;
  variantText: string;
  budget: string;
  frequencyCapText: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    localeText: string,
    variantText: string,
    budget: string,
    frequencyCapText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.localeText = localeText;
    this.variantText = variantText;
    this.budget = budget;
    this.frequencyCapText = frequencyCapText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toFlightProposalView(item: FlightProposal): FlightProposalView {
  return new FlightProposalView(
    text.truncate(item.code, 120),
    item.label,
    item.locale,
    text.truncate(item.variant, 120),
    item.budget.toFixed(2),
    String(item.frequencyCap),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightProposalViews(items: FlightProposal[]): FlightProposalView[] {
  const views: FlightProposalView[] = [];
  for (const item of items) {
    views.push(toFlightProposalView(item));
  }
  return views;
}

export function sumFlightProposalView(view: FlightProposalView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedBudget + parsedFrequencyCap + parsedMargin;
}
