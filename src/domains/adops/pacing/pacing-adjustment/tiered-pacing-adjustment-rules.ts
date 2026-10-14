import { TieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

/** A rule a tiered pacing adjustment must pass. Check returns its problems, or none. */
export interface TieredPacingAdjustmentRule {
  check(item: TieredPacingAdjustment): string[];
}

export class TieredPacingAdjustmentBudgetRangeRule implements TieredPacingAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPacingAdjustment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPacingAdjustmentCodeLengthRule implements TieredPacingAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPacingAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPacingAdjustmentCodePrefixRule implements TieredPacingAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPacingAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered pacing adjustment. */
export class TieredPacingAdjustmentValidator {
  rules: TieredPacingAdjustmentRule[];

  constructor(rules: TieredPacingAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPacingAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingAdjustment[]): Map<string, string[]> {
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

export function defaultTieredPacingAdjustmentValidator(): TieredPacingAdjustmentValidator {
  return new TieredPacingAdjustmentValidator(
    [
      new TieredPacingAdjustmentBudgetRangeRule(7.6, 1938.3),
      new TieredPacingAdjustmentCodeLengthRule(86400),
      new TieredPacingAdjustmentCodePrefixRule("REF"),
    ],
  );
}
