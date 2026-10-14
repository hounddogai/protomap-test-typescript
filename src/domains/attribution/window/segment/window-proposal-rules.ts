import * as text from "../../../../kit/text.js";
import { WindowProposal } from "./window-proposal.js";

/** A rule a window proposal must pass. Check returns its problems, or none. */
export interface WindowProposalRule {
  check(item: WindowProposal): string[];
}

export class WindowProposalAllowedTitleRule implements WindowProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

export class WindowProposalArchivedGuardRule implements WindowProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WindowProposal): string[] {
    if (item.archived && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class WindowProposalTitleLengthRule implements WindowProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowProposalExpiresAtRangeRule implements WindowProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowProposal): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowProposalRequiredTitleRule implements WindowProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window proposal. */
export class WindowProposalValidator {
  rules: WindowProposalRule[];

  constructor(rules: WindowProposalRule[]) {
    this.rules = rules;
  }

  validate(item: WindowProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowProposal[]): Map<string, string[]> {
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

export function defaultWindowProposalValidator(): WindowProposalValidator {
  return new WindowProposalValidator(
    [
      new WindowProposalAllowedTitleRule(["seasonal", "weighted"]),
      new WindowProposalArchivedGuardRule(3.7),
      new WindowProposalTitleLengthRule(16),
      new WindowProposalExpiresAtRangeRule(1000, 3600),
      new WindowProposalRequiredTitleRule("window proposal needs this field"),
    ],
  );
}
