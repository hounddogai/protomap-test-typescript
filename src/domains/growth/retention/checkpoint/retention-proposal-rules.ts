import * as text from "../../../../kit/text.js";
import { RetentionProposal } from "./retention-proposal.js";

/** A rule a retention proposal must pass. Check returns its problems, or none. */
export interface RetentionProposalRule {
  check(item: RetentionProposal): string[];
}

export class RetentionProposalCapacityRangeRule implements RetentionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionProposal): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionProposalRequiredCodeRule implements RetentionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionProposalRequiredTitleRule implements RetentionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionProposalOpenRateRangeRule implements RetentionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionProposal): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionProposalAllowedNameRule implements RetentionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

/** Runs every rule of a retention proposal. */
export class RetentionProposalValidator {
  rules: RetentionProposalRule[];

  constructor(rules: RetentionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionProposal[]): Map<string, string[]> {
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

export function defaultRetentionProposalValidator(): RetentionProposalValidator {
  return new RetentionProposalValidator(
    [
      new RetentionProposalCapacityRangeRule(16, 1000),
      new RetentionProposalRequiredCodeRule("retention proposal needs an entry"),
      new RetentionProposalRequiredTitleRule("retention proposal needs this field"),
      new RetentionProposalOpenRateRangeRule(4.7, 4380.1),
      new RetentionProposalAllowedNameRule(["manual", "regional"]),
    ],
  );
}
