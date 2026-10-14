import { TieredPreferenceEntry } from "./tiered-preference-entry.js";

/** A rule a tiered preference entry must pass. Check returns its problems, or none. */
export interface TieredPreferenceEntryRule {
  check(item: TieredPreferenceEntry): string[];
}

export class TieredPreferenceEntryNameLengthRule implements TieredPreferenceEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPreferenceEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPreferenceEntryRequiredCodeRule implements TieredPreferenceEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPreferenceEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPreferenceEntryConversionRateRangeRule implements TieredPreferenceEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPreferenceEntry): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredPreferenceEntryThresholdRangeRule implements TieredPreferenceEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPreferenceEntry): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered preference entry. */
export class TieredPreferenceEntryValidator {
  rules: TieredPreferenceEntryRule[];

  constructor(rules: TieredPreferenceEntryRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPreferenceEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredPreferenceEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPreferenceEntry[]): Map<string, string[]> {
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

export function defaultTieredPreferenceEntryValidator(): TieredPreferenceEntryValidator {
  return new TieredPreferenceEntryValidator(
    [
      new TieredPreferenceEntryNameLengthRule(86400),
      new TieredPreferenceEntryRequiredCodeRule("tiered preference entry needs this field"),
      new TieredPreferenceEntryConversionRateRangeRule(4, 3794.1),
      new TieredPreferenceEntryThresholdRangeRule(4.6, 1597.4),
    ],
  );
}
