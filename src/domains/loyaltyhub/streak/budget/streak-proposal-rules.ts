import { StreakProposal } from "./streak-proposal.js";

/** A rule a streak proposal must pass. Check returns its problems, or none. */
export interface StreakProposalRule {
  check(item: StreakProposal): string[];
}

export class StreakProposalRequiredNameRule implements StreakProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StreakProposalCodeLengthRule implements StreakProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakProposalRateRangeRule implements StreakProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakProposal): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StreakProposalRequiredCodeRule implements StreakProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak proposal. */
export class StreakProposalValidator {
  rules: StreakProposalRule[];

  constructor(rules: StreakProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StreakProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakProposal[]): Map<string, string[]> {
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

export function defaultStreakProposalValidator(): StreakProposalValidator {
  return new StreakProposalValidator(
    [
      new StreakProposalRequiredNameRule("streak proposal needs an entry"),
      new StreakProposalCodeLengthRule(32),
      new StreakProposalRateRangeRule(5.1, 3401.4),
      new StreakProposalRequiredCodeRule("streak proposal needs this field"),
    ],
  );
}
