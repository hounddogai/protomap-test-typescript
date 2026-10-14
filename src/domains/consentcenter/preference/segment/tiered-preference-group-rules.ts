import { TieredPreferenceGroup } from "./tiered-preference-group.js";

/** A rule a tiered preference group must pass. Check returns its problems, or none. */
export interface TieredPreferenceGroupRule {
  check(item: TieredPreferenceGroup): string[];
}

export class TieredPreferenceGroupRequiredChecksumRule implements TieredPreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPreferenceGroup): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPreferenceGroupLabelLengthRule implements TieredPreferenceGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPreferenceGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPreferenceGroupRequiredCodeRule implements TieredPreferenceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPreferenceGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPreferenceGroupQuantityRangeRule implements TieredPreferenceGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPreferenceGroup): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered preference group. */
export class TieredPreferenceGroupValidator {
  rules: TieredPreferenceGroupRule[];

  constructor(rules: TieredPreferenceGroupRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPreferenceGroup): string[] {
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

  requireValid(item: TieredPreferenceGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPreferenceGroup[]): Map<string, string[]> {
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

export function defaultTieredPreferenceGroupValidator(): TieredPreferenceGroupValidator {
  return new TieredPreferenceGroupValidator(
    [
      new TieredPreferenceGroupRequiredChecksumRule("tiered preference group needs a value"),
      new TieredPreferenceGroupLabelLengthRule(120),
      new TieredPreferenceGroupRequiredCodeRule("tiered preference group needs an entry"),
      new TieredPreferenceGroupQuantityRangeRule(80, 86400),
    ],
  );
}
