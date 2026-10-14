import * as text from "../../../../kit/text.js";
import { ChallengeMilestone } from "./challenge-milestone.js";

/** A rule a challenge milestone must pass. Check returns its problems, or none. */
export interface ChallengeMilestoneRule {
  check(item: ChallengeMilestone): string[];
}

export class ChallengeMilestoneVariantLengthRule implements ChallengeMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeMilestone): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeMilestoneCodePrefixRule implements ChallengeMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeMilestoneBudgetRangeRule implements ChallengeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeMilestone): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeMilestoneUpdatedAtRangeRule implements ChallengeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeMilestone): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeMilestoneAllowedNameRule implements ChallengeMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class ChallengeMilestoneStartsAtRangeRule implements ChallengeMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeMilestone): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a challenge milestone. */
export class ChallengeMilestoneValidator {
  rules: ChallengeMilestoneRule[];

  constructor(rules: ChallengeMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeMilestone[]): Map<string, string[]> {
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

export function defaultChallengeMilestoneValidator(): ChallengeMilestoneValidator {
  return new ChallengeMilestoneValidator(
    [
      new ChallengeMilestoneVariantLengthRule(3600),
      new ChallengeMilestoneCodePrefixRule("Q"),
      new ChallengeMilestoneBudgetRangeRule(4.8, 832.3),
      new ChallengeMilestoneUpdatedAtRangeRule(1000, 1000),
      new ChallengeMilestoneAllowedNameRule([]),
      new ChallengeMilestoneStartsAtRangeRule(32, 80),
    ],
  );
}
