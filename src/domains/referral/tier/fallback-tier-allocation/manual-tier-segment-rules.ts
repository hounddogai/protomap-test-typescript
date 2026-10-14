import { ManualTierSegment } from "./manual-tier-segment.js";

/** A rule a manual tier segment must pass. Check returns its problems, or none. */
export interface ManualTierSegmentRule {
  check(item: ManualTierSegment): string[];
}

export class ManualTierSegmentCurrencyLengthRule implements ManualTierSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierSegment): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierSegmentGraceDaysRangeRule implements ManualTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTierSegment): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTierSegmentTitleLengthRule implements ManualTierSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierSegmentRequiredTitleRule implements ManualTierSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierSegmentCodePrefixRule implements ManualTierSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTierSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualTierSegmentCapacityRangeRule implements ManualTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTierSegment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual tier segment. */
export class ManualTierSegmentValidator {
  rules: ManualTierSegmentRule[];

  constructor(rules: ManualTierSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTierSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierSegment[]): Map<string, string[]> {
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

export function defaultManualTierSegmentValidator(): ManualTierSegmentValidator {
  return new ManualTierSegmentValidator(
    [
      new ManualTierSegmentCurrencyLengthRule(1000),
      new ManualTierSegmentGraceDaysRangeRule(32, 80),
      new ManualTierSegmentTitleLengthRule(120),
      new ManualTierSegmentRequiredTitleRule("manual tier segment needs an entry"),
      new ManualTierSegmentCodePrefixRule("OPS"),
      new ManualTierSegmentCapacityRangeRule(64, 64),
    ],
  );
}
