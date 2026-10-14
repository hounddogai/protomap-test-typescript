import * as text from "../../../../kit/text.js";
import { TicketViewProposal } from "./ticket-view-proposal.js";

/** A rule a ticket view proposal must pass. Check returns its problems, or none. */
export interface TicketViewProposalRule {
  check(item: TicketViewProposal): string[];
}

export class TicketViewProposalCampaignRefLengthRule implements TicketViewProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewProposal): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewProposalAllowedReviewerRule implements TicketViewProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is out of range`];
    return [];
  }
}

export class TicketViewProposalRequiredCampaignRefRule implements TicketViewProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewProposal): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view proposal. */
export class TicketViewProposalValidator {
  rules: TicketViewProposalRule[];

  constructor(rules: TicketViewProposalRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewProposal[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultTicketViewProposalValidator(): TicketViewProposalValidator {
  return new TicketViewProposalValidator(
    [
      new TicketViewProposalCampaignRefLengthRule(255),
      new TicketViewProposalAllowedReviewerRule(["manual"]),
      new TicketViewProposalRequiredCampaignRefRule("ticket view proposal needs an entry"),
    ],
  );
}
