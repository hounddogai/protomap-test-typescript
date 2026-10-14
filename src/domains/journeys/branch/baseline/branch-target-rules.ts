import { BranchTarget } from "./branch-target.js";

/** A rule a branch target must pass. Check returns its problems, or none. */
export interface BranchTargetRule {
  check(item: BranchTarget): string[];
}

export class BranchTargetDurationMinutesRangeRule implements BranchTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchTarget): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchTargetCodeLengthRule implements BranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchTargetRegionLengthRule implements BranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchTarget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch target. */
export class BranchTargetValidator {
  rules: BranchTargetRule[];

  constructor(rules: BranchTargetRule[]) {
    this.rules = rules;
  }

  validate(item: BranchTarget): string[] {
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

  requireValid(item: BranchTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchTarget[]): Map<string, string[]> {
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

export function defaultBranchTargetValidator(): BranchTargetValidator {
  return new BranchTargetValidator(
    [
      new BranchTargetDurationMinutesRangeRule(255, 3600),
      new BranchTargetCodeLengthRule(32),
      new BranchTargetRegionLengthRule(120),
    ],
  );
}
