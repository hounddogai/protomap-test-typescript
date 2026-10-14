import { TieredDeflectionTier } from "./tiered-deflection-tier.js";

/** A rule a tiered deflection tier must pass. Check returns its problems, or none. */
export interface TieredDeflectionTierRule {
  check(item: TieredDeflectionTier): string[];
}

export class TieredDeflectionTierRequiredLabelRule implements TieredDeflectionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDeflectionTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDeflectionTierCodePrefixRule implements TieredDeflectionTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredDeflectionTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredDeflectionTierWindowDaysRangeRule implements TieredDeflectionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDeflectionTier): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDeflectionTierCodeLengthRule implements TieredDeflectionTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionTierAttemptsRangeRule implements TieredDeflectionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDeflectionTier): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered deflection tier. */
export class TieredDeflectionTierValidator {
  rules: TieredDeflectionTierRule[];

  constructor(rules: TieredDeflectionTierRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDeflectionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDeflectionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDeflectionTier[]): Map<string, string[]> {
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

export function defaultTieredDeflectionTierValidator(): TieredDeflectionTierValidator {
  return new TieredDeflectionTierValidator(
    [
      new TieredDeflectionTierRequiredLabelRule("tiered deflection tier needs an entry"),
      new TieredDeflectionTierCodePrefixRule("REF"),
      new TieredDeflectionTierWindowDaysRangeRule(3600, 3600),
      new TieredDeflectionTierCodeLengthRule(120),
      new TieredDeflectionTierAttemptsRangeRule(32, 255),
    ],
  );
}
