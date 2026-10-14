import { TieredWarmupCycle } from "./tiered-warmup-cycle.js";

/** A rule a tiered warmup cycle must pass. Check returns its problems, or none. */
export interface TieredWarmupCycleRule {
  check(item: TieredWarmupCycle): string[];
}

export class TieredWarmupCycleDiscountRangeRule implements TieredWarmupCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWarmupCycle): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredWarmupCycleLabelLengthRule implements TieredWarmupCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWarmupCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWarmupCycleCurrencyLengthRule implements TieredWarmupCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWarmupCycle): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWarmupCycleRequiredLabelRule implements TieredWarmupCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered warmup cycle. */
export class TieredWarmupCycleValidator {
  rules: TieredWarmupCycleRule[];

  constructor(rules: TieredWarmupCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWarmupCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredWarmupCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWarmupCycle[]): Map<string, string[]> {
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

export function defaultTieredWarmupCycleValidator(): TieredWarmupCycleValidator {
  return new TieredWarmupCycleValidator(
    [
      new TieredWarmupCycleDiscountRangeRule(8.2, 560.4),
      new TieredWarmupCycleLabelLengthRule(32),
      new TieredWarmupCycleCurrencyLengthRule(16),
      new TieredWarmupCycleRequiredLabelRule("tiered warmup cycle needs a value"),
    ],
  );
}
