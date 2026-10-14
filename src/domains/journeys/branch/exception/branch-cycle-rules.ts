import { BranchCycle } from "./branch-cycle.js";

/** A rule a branch cycle must pass. Check returns its problems, or none. */
export interface BranchCycleRule {
  check(item: BranchCycle): string[];
}

export class BranchCycleMinimumRangeRule implements BranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchCycle): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchCycleWindowDaysRangeRule implements BranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchCycle): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchCycleTitleLengthRule implements BranchCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchCycleLimitRangeRule implements BranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchCycle): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchCycleRequiredTitleRule implements BranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch cycle. */
export class BranchCycleValidator {
  rules: BranchCycleRule[];

  constructor(rules: BranchCycleRule[]) {
    this.rules = rules;
  }

  validate(item: BranchCycle): string[] {
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

  requireValid(item: BranchCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchCycle[]): Map<string, string[]> {
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

export function defaultBranchCycleValidator(): BranchCycleValidator {
  return new BranchCycleValidator(
    [
      new BranchCycleMinimumRangeRule(5.9, 4670.8),
      new BranchCycleWindowDaysRangeRule(255, 1000),
      new BranchCycleTitleLengthRule(80),
      new BranchCycleLimitRangeRule(64, 86400),
      new BranchCycleRequiredTitleRule("branch cycle needs an entry"),
    ],
  );
}
