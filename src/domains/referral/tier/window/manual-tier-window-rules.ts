import { ManualTierWindow } from "./manual-tier-window.js";

/** A rule a manual tier window must pass. Check returns its problems, or none. */
export interface ManualTierWindowRule {
  check(item: ManualTierWindow): string[];
}

export class ManualTierWindowTitleLengthRule implements ManualTierWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierWindowNameLengthRule implements ManualTierWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierWindowQuantityRangeRule implements ManualTierWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTierWindow): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTierWindowSourceLengthRule implements ManualTierWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierWindow): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual tier window. */
export class ManualTierWindowValidator {
  rules: ManualTierWindowRule[];

  constructor(rules: ManualTierWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierWindow): string[] {
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

  requireValid(item: ManualTierWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierWindow[]): Map<string, string[]> {
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

export function defaultManualTierWindowValidator(): ManualTierWindowValidator {
  return new ManualTierWindowValidator(
    [
      new ManualTierWindowTitleLengthRule(32),
      new ManualTierWindowNameLengthRule(16),
      new ManualTierWindowQuantityRangeRule(16, 3600),
      new ManualTierWindowSourceLengthRule(3600),
    ],
  );
}
