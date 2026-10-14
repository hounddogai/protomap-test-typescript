import { ScheduledStepProposal } from "./scheduled-step-proposal.js";

/** A rule a scheduled step proposal must pass. Check returns its problems, or none. */
export interface ScheduledStepProposalRule {
  check(item: ScheduledStepProposal): string[];
}

export class ScheduledStepProposalCostRangeRule implements ScheduledStepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledStepProposal): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledStepProposalRetriesRangeRule implements ScheduledStepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledStepProposal): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledStepProposalCategoryLengthRule implements ScheduledStepProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledStepProposal): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled step proposal. */
export class ScheduledStepProposalValidator {
  rules: ScheduledStepProposalRule[];

  constructor(rules: ScheduledStepProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledStepProposal): string[] {
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

  requireValid(item: ScheduledStepProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledStepProposal[]): Map<string, string[]> {
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

export function defaultScheduledStepProposalValidator(): ScheduledStepProposalValidator {
  return new ScheduledStepProposalValidator(
    [
      new ScheduledStepProposalCostRangeRule(5.5, 523.5),
      new ScheduledStepProposalRetriesRangeRule(32, 86400),
      new ScheduledStepProposalCategoryLengthRule(16),
    ],
  );
}
