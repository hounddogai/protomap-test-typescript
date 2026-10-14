import { TieredOptOutCycle } from "./tiered-opt-out-cycle.js";

/** A rule a tiered opt out cycle must pass. Check returns its problems, or none. */
export interface TieredOptOutCycleRule {
  check(item: TieredOptOutCycle): string[];
}

export class TieredOptOutCycleLabelLengthRule implements TieredOptOutCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredOptOutCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredOptOutCycleCodePrefixRule implements TieredOptOutCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredOptOutCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredOptOutCycleQuantityRangeRule implements TieredOptOutCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredOptOutCycle): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredOptOutCycleRequiredCodeRule implements TieredOptOutCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredOptOutCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered opt out cycle. */
export class TieredOptOutCycleValidator {
  rules: TieredOptOutCycleRule[];

  constructor(rules: TieredOptOutCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredOptOutCycle): string[] {
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

  requireValid(item: TieredOptOutCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredOptOutCycle[]): Map<string, string[]> {
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

export function defaultTieredOptOutCycleValidator(): TieredOptOutCycleValidator {
  return new TieredOptOutCycleValidator(
    [
      new TieredOptOutCycleLabelLengthRule(64),
      new TieredOptOutCycleCodePrefixRule("OPS"),
      new TieredOptOutCycleQuantityRangeRule(16, 120),
      new TieredOptOutCycleRequiredCodeRule("tiered opt out cycle needs a value"),
    ],
  );
}
