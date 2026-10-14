import { StrictBadgeAllocation } from "./strict-badge-allocation.js";

/** A rule a strict badge allocation must pass. Check returns its problems, or none. */
export interface StrictBadgeAllocationRule {
  check(item: StrictBadgeAllocation): string[];
}

export class StrictBadgeAllocationCodeLengthRule implements StrictBadgeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBadgeAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBadgeAllocationRequiredTitleRule implements StrictBadgeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBadgeAllocation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBadgeAllocationAttemptsRangeRule implements StrictBadgeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBadgeAllocation): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictBadgeAllocationScoreRangeRule implements StrictBadgeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBadgeAllocation): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict badge allocation. */
export class StrictBadgeAllocationValidator {
  rules: StrictBadgeAllocationRule[];

  constructor(rules: StrictBadgeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBadgeAllocation): string[] {
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

  requireValid(item: StrictBadgeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBadgeAllocation[]): Map<string, string[]> {
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

export function defaultStrictBadgeAllocationValidator(): StrictBadgeAllocationValidator {
  return new StrictBadgeAllocationValidator(
    [
      new StrictBadgeAllocationCodeLengthRule(86400),
      new StrictBadgeAllocationRequiredTitleRule("strict badge allocation needs this field"),
      new StrictBadgeAllocationAttemptsRangeRule(80, 3600),
      new StrictBadgeAllocationScoreRangeRule(8.4, 3471.3),
    ],
  );
}
