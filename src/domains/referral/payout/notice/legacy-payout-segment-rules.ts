import { LegacyPayoutSegment } from "./legacy-payout-segment.js";

/** A rule a legacy payout segment must pass. Check returns its problems, or none. */
export interface LegacyPayoutSegmentRule {
  check(item: LegacyPayoutSegment): string[];
}

export class LegacyPayoutSegmentQuantityRangeRule implements LegacyPayoutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPayoutSegment): string[] {
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

export class LegacyPayoutSegmentUnitLengthRule implements LegacyPayoutSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutSegment): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutSegmentRequiredCurrencyRule implements LegacyPayoutSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutSegment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy payout segment. */
export class LegacyPayoutSegmentValidator {
  rules: LegacyPayoutSegmentRule[];

  constructor(rules: LegacyPayoutSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPayoutSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPayoutSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPayoutSegment[]): Map<string, string[]> {
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

export function defaultLegacyPayoutSegmentValidator(): LegacyPayoutSegmentValidator {
  return new LegacyPayoutSegmentValidator(
    [
      new LegacyPayoutSegmentQuantityRangeRule(3600, 3600),
      new LegacyPayoutSegmentUnitLengthRule(32),
      new LegacyPayoutSegmentRequiredCurrencyRule("legacy payout segment needs this field"),
    ],
  );
}
