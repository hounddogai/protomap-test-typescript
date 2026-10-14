import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

/** How screens and exports show a primary exit rule proposal. */
export class PrimaryExitRuleProposalView {
  codeText: string;
  name: string;
  title: string;
  externalRefText: string;
  attemptsText: string;
  ownerId: string;
  cohort: string;
  expiresAt: string;
  maximum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    title: string,
    externalRefText: string,
    attemptsText: string,
    ownerId: string,
    cohort: string,
    expiresAt: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.title = title;
    this.externalRefText = externalRefText;
    this.attemptsText = attemptsText;
    this.ownerId = ownerId;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryExitRuleProposalView(item: PrimaryExitRuleProposal): PrimaryExitRuleProposalView {
  return new PrimaryExitRuleProposalView(
    item.code,
    text.truncate(item.name, 80),
    text.truncate(item.title, 80),
    item.externalRef,
    String(item.attempts),
    item.ownerId,
    item.cohort,
    String(item.expiresAt),
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryExitRuleProposalViews(items: PrimaryExitRuleProposal[]): PrimaryExitRuleProposalView[] {
  const views: PrimaryExitRuleProposalView[] = [];
  for (const item of items) {
    views.push(toPrimaryExitRuleProposalView(item));
  }
  return views;
}

export function sumPrimaryExitRuleProposalView(view: PrimaryExitRuleProposalView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedAttempts + parsedExpiresAt + parsedMaximum;
}
