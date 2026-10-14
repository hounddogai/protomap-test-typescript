import * as text from "../../../../kit/text.js";
import { QueueProposal } from "./queue-proposal.js";

/** A rule a queue proposal must pass. Check returns its problems, or none. */
export interface QueueProposalRule {
  check(item: QueueProposal): string[];
}

export class QueueProposalAllowedUtmSourceRule implements QueueProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

export class QueueProposalRequiredSourceRule implements QueueProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueProposal): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class QueueProposalSourceLengthRule implements QueueProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueProposal): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue proposal. */
export class QueueProposalValidator {
  rules: QueueProposalRule[];

  constructor(rules: QueueProposalRule[]) {
    this.rules = rules;
  }

  validate(item: QueueProposal): string[] {
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

  requireValid(item: QueueProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueProposal[]): Map<string, string[]> {
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

export function defaultQueueProposalValidator(): QueueProposalValidator {
  return new QueueProposalValidator(
    [
      new QueueProposalAllowedUtmSourceRule(["default", "fallback", "pending"]),
      new QueueProposalRequiredSourceRule("queue proposal needs a value"),
      new QueueProposalSourceLengthRule(255),
    ],
  );
}
