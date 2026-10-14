import { CappedWaitAdjustment } from "./capped-wait-adjustment.js";

/** A rule a capped wait adjustment must pass. Check returns its problems, or none. */
export interface CappedWaitAdjustmentRule {
  check(item: CappedWaitAdjustment): string[];
}

export class CappedWaitAdjustmentGraceDaysRangeRule implements CappedWaitAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedWaitAdjustment): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedWaitAdjustmentDescriptionLengthRule implements CappedWaitAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWaitAdjustment): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWaitAdjustmentContactEmailLengthRule implements CappedWaitAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedWaitAdjustment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedWaitAdjustmentCodePrefixRule implements CappedWaitAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedWaitAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a capped wait adjustment. */
export class CappedWaitAdjustmentValidator {
  rules: CappedWaitAdjustmentRule[];

  constructor(rules: CappedWaitAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: CappedWaitAdjustment): string[] {
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

  requireValid(item: CappedWaitAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedWaitAdjustment[]): Map<string, string[]> {
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

export function defaultCappedWaitAdjustmentValidator(): CappedWaitAdjustmentValidator {
  return new CappedWaitAdjustmentValidator(
    [
      new CappedWaitAdjustmentGraceDaysRangeRule(64, 80),
      new CappedWaitAdjustmentDescriptionLengthRule(80),
      new CappedWaitAdjustmentContactEmailLengthRule(255),
      new CappedWaitAdjustmentCodePrefixRule("OPS"),
    ],
  );
}
