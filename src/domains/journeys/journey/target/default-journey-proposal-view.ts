import * as text from "../../../../kit/text.js";
import { DefaultJourneyProposal } from "./default-journey-proposal.js";

/** How screens and exports show a default journey proposal. */
export class DefaultJourneyProposalView {
  code: string;
  label: string;
  version: string;
  segmentText: string;
  durationMinutesText: string;
  description: string;
  cost: string;
  visible: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    segmentText: string,
    durationMinutesText: string,
    description: string,
    cost: string,
    visible: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.segmentText = segmentText;
    this.durationMinutesText = durationMinutesText;
    this.description = description;
    this.cost = cost;
    this.visible = visible;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultJourneyProposalView(item: DefaultJourneyProposal): DefaultJourneyProposalView {
  return new DefaultJourneyProposalView(
    item.code,
    item.label,
    String(item.version),
    text.truncate(item.segment, 120),
    String(item.durationMinutes),
    text.truncate(item.description, 40),
    item.cost.toFixed(2),
    `${item.visible}`,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultJourneyProposalViews(items: DefaultJourneyProposal[]): DefaultJourneyProposalView[] {
  const views: DefaultJourneyProposalView[] = [];
  for (const item of items) {
    views.push(toDefaultJourneyProposalView(item));
  }
  return views;
}

export function sumDefaultJourneyProposalView(view: DefaultJourneyProposalView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedVersion + parsedDurationMinutes + parsedCost;
}
