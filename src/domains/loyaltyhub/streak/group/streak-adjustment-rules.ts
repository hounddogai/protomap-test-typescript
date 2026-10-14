import { StreakAdjustment } from "./streak-adjustment.js";

/** A rule a streak adjustment must pass. Check returns its problems, or none. */
export interface StreakAdjustmentRule {
  check(item: StreakAdjustment): string[];
}

export class StreakAdjustmentCodeLengthRule implements StreakAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakAdjustmentVariantLengthRule implements StreakAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakAdjustment): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakAdjustmentCodePrefixRule implements StreakAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a streak adjustment. */
export class StreakAdjustmentValidator {
  rules: StreakAdjustmentRule[];

  constructor(rules: StreakAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StreakAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakAdjustment[]): Map<string, string[]> {
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

export function defaultStreakAdjustmentValidator(): StreakAdjustmentValidator {
  return new StreakAdjustmentValidator(
    [
      new StreakAdjustmentCodeLengthRule(64),
      new StreakAdjustmentVariantLengthRule(120),
      new StreakAdjustmentCodePrefixRule("X"),
    ],
  );
}
