import { LevelProposal } from "./level-proposal.js";

/** A rule a level proposal must pass. Check returns its problems, or none. */
export interface LevelProposalRule {
  check(item: LevelProposal): string[];
}

export class LevelProposalRateRangeRule implements LevelProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelProposal): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelProposalRequiredOwnerIdRule implements LevelProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelProposal): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LevelProposalLabelLengthRule implements LevelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelProposalCodeLengthRule implements LevelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level proposal. */
export class LevelProposalValidator {
  rules: LevelProposalRule[];

  constructor(rules: LevelProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LevelProposal): string[] {
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

  requireValid(item: LevelProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelProposal[]): Map<string, string[]> {
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

export function defaultLevelProposalValidator(): LevelProposalValidator {
  return new LevelProposalValidator(
    [
      new LevelProposalRateRangeRule(4.8, 1722.3),
      new LevelProposalRequiredOwnerIdRule("level proposal needs this field"),
      new LevelProposalLabelLengthRule(86400),
      new LevelProposalCodeLengthRule(86400),
    ],
  );
}
