import * as text from "../../../../kit/text.js";
import { SubscriptionProposal } from "./subscription-proposal.js";

/** A rule a subscription proposal must pass. Check returns its problems, or none. */
export interface SubscriptionProposalRule {
  check(item: SubscriptionProposal): string[];
}

export class SubscriptionProposalAllowedCodeRule implements SubscriptionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class SubscriptionProposalRequiredLabelRule implements SubscriptionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionProposalCreatedAtRangeRule implements SubscriptionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionProposal): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription proposal. */
export class SubscriptionProposalValidator {
  rules: SubscriptionProposalRule[];

  constructor(rules: SubscriptionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionProposal[]): Map<string, string[]> {
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

export function defaultSubscriptionProposalValidator(): SubscriptionProposalValidator {
  return new SubscriptionProposalValidator(
    [
      new SubscriptionProposalAllowedCodeRule(["scheduled", "batched"]),
      new SubscriptionProposalRequiredLabelRule("subscription proposal needs an entry"),
      new SubscriptionProposalCreatedAtRangeRule(16, 255),
    ],
  );
}
