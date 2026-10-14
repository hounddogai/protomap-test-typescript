import * as text from "../../../../kit/text.js";
import { GlobalFlightProposal } from "./global-flight-proposal.js";

/** How screens and exports show a global flight proposal. */
export class GlobalFlightProposalView {
  codeText: string;
  name: string;
  descriptionText: string;
  notes: string;
  title: string;
  contactEmailText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    descriptionText: string,
    notes: string,
    title: string,
    contactEmailText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.descriptionText = descriptionText;
    this.notes = notes;
    this.title = title;
    this.contactEmailText = contactEmailText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightProposalView(item: GlobalFlightProposal): GlobalFlightProposalView {
  return new GlobalFlightProposalView(
    item.code,
    text.truncate(item.name, 64),
    item.description,
    text.truncate(item.notes, 40),
    item.title,
    text.truncate(item.contactEmail, 80),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightProposalViews(items: GlobalFlightProposal[]): GlobalFlightProposalView[] {
  const views: GlobalFlightProposalView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightProposalView(item));
  }
  return views;
}

export function sumGlobalFlightProposalView(view: GlobalFlightProposalView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
