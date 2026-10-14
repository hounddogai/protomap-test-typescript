import * as text from "../../../../kit/text.js";
import { ExitRuleProposal } from "./exit-rule-proposal.js";

/** How screens and exports show a exit rule proposal. */
export class ExitRuleProposalView {
  codeText: string;
  name: string;
  priority: string;
  contactEmail: string;
  cohort: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    priority: string,
    contactEmail: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleProposalView(item: ExitRuleProposal): ExitRuleProposalView {
  return new ExitRuleProposalView(
    item.code,
    item.name,
    String(item.priority),
    text.truncate(item.contactEmail, 120),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleProposalViews(items: ExitRuleProposal[]): ExitRuleProposalView[] {
  const views: ExitRuleProposalView[] = [];
  for (const item of items) {
    views.push(toExitRuleProposalView(item));
  }
  return views;
}

export function sumExitRuleProposalView(view: ExitRuleProposalView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedPriority;
}
