import { TieredBranchCycle } from "./tiered-branch-cycle.js";

/** A rule a tiered branch cycle must pass. Check returns its problems, or none. */
export interface TieredBranchCycleRule {
  check(item: TieredBranchCycle): string[];
}

export class TieredBranchCycleWindowDaysRangeRule implements TieredBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBranchCycle): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBranchCycleRequiredCodeRule implements TieredBranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBranchCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBranchCycleMaximumRangeRule implements TieredBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBranchCycle): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBranchCycleRatioRangeRule implements TieredBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBranchCycle): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBranchCycleLabelLengthRule implements TieredBranchCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBranchCycleCodeLengthRule implements TieredBranchCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered branch cycle. */
export class TieredBranchCycleValidator {
  rules: TieredBranchCycleRule[];

  constructor(rules: TieredBranchCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBranchCycle): string[] {
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

  requireValid(item: TieredBranchCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBranchCycle[]): Map<string, string[]> {
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

export function defaultTieredBranchCycleValidator(): TieredBranchCycleValidator {
  return new TieredBranchCycleValidator(
    [
      new TieredBranchCycleWindowDaysRangeRule(80, 86400),
      new TieredBranchCycleRequiredCodeRule("tiered branch cycle needs an entry"),
      new TieredBranchCycleMaximumRangeRule(9.1, 763.7),
      new TieredBranchCycleRatioRangeRule(6.2, 1884.7),
      new TieredBranchCycleLabelLengthRule(1000),
      new TieredBranchCycleCodeLengthRule(86400),
    ],
  );
}
