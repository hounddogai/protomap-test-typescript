import * as text from "../../../../kit/text.js";
import { FrequencyProposal } from "./frequency-proposal.js";

/** How screens and exports show a frequency proposal. */
export class FrequencyProposalView {
  code: string;
  title: string;
  budget: string;
  name: string;
  floorValue: string;
  active: string;
  channel: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    budget: string,
    name: string,
    floorValue: string,
    active: string,
    channel: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.name = name;
    this.floorValue = floorValue;
    this.active = active;
    this.channel = channel;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toFrequencyProposalView(item: FrequencyProposal): FrequencyProposalView {
  return new FrequencyProposalView(
    item.code,
    item.title,
    item.budget.toFixed(2),
    text.truncate(item.name, 80),
    item.floorValue.toFixed(2),
    `${item.active}`,
    text.truncate(item.channel, 40),
    text.truncate(item.cohort, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFrequencyProposalViews(items: FrequencyProposal[]): FrequencyProposalView[] {
  const views: FrequencyProposalView[] = [];
  for (const item of items) {
    views.push(toFrequencyProposalView(item));
  }
  return views;
}

export function sumFrequencyProposalView(view: FrequencyProposalView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedBudget + parsedFloorValue;
}
