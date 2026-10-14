import { BatchedStepProposal } from "./batched-step-proposal.js";

/** A rule a batched step proposal must pass. Check returns its problems, or none. */
export interface BatchedStepProposalRule {
  check(item: BatchedStepProposal): string[];
}

export class BatchedStepProposalPriorityRangeRule implements BatchedStepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedStepProposal): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedStepProposalCountryLengthRule implements BatchedStepProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedStepProposal): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedStepProposalMarginRangeRule implements BatchedStepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedStepProposal): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedStepProposalGraceDaysRangeRule implements BatchedStepProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedStepProposal): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedStepProposalCodePrefixRule implements BatchedStepProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedStepProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedStepProposalRequiredNameRule implements BatchedStepProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedStepProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched step proposal. */
export class BatchedStepProposalValidator {
  rules: BatchedStepProposalRule[];

  constructor(rules: BatchedStepProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedStepProposal): string[] {
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

  requireValid(item: BatchedStepProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedStepProposal[]): Map<string, string[]> {
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

export function defaultBatchedStepProposalValidator(): BatchedStepProposalValidator {
  return new BatchedStepProposalValidator(
    [
      new BatchedStepProposalPriorityRangeRule(32, 120),
      new BatchedStepProposalCountryLengthRule(16),
      new BatchedStepProposalMarginRangeRule(6.3, 4111.6),
      new BatchedStepProposalGraceDaysRangeRule(80, 86400),
      new BatchedStepProposalCodePrefixRule("X"),
      new BatchedStepProposalRequiredNameRule("batched step proposal needs a value"),
    ],
  );
}
