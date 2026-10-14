import * as text from "../../../../kit/text.js";
import { ManualStreakTarget } from "./manual-streak-target.js";

/** A rule a manual streak target must pass. Check returns its problems, or none. */
export interface ManualStreakTargetRule {
  check(item: ManualStreakTarget): string[];
}

export class ManualStreakTargetLocaleLengthRule implements ManualStreakTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualStreakTarget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualStreakTargetRequiredCodeRule implements ManualStreakTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualStreakTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualStreakTargetAllowedCodeRule implements ManualStreakTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualStreakTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ManualStreakTargetStartsAtRangeRule implements ManualStreakTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualStreakTarget): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual streak target. */
export class ManualStreakTargetValidator {
  rules: ManualStreakTargetRule[];

  constructor(rules: ManualStreakTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualStreakTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualStreakTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualStreakTarget[]): Map<string, string[]> {
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

export function defaultManualStreakTargetValidator(): ManualStreakTargetValidator {
  return new ManualStreakTargetValidator(
    [
      new ManualStreakTargetLocaleLengthRule(64),
      new ManualStreakTargetRequiredCodeRule("manual streak target needs this field"),
      new ManualStreakTargetAllowedCodeRule([]),
      new ManualStreakTargetStartsAtRangeRule(32, 1000),
    ],
  );
}
