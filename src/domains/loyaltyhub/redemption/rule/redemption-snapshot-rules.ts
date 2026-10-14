import { RedemptionSnapshot } from "./redemption-snapshot.js";

/** A rule a redemption snapshot must pass. Check returns its problems, or none. */
export interface RedemptionSnapshotRule {
  check(item: RedemptionSnapshot): string[];
}

export class RedemptionSnapshotCodePrefixRule implements RedemptionSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionSnapshotLabelLengthRule implements RedemptionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionSnapshotConversionRateRangeRule implements RedemptionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionSnapshot): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a redemption snapshot. */
export class RedemptionSnapshotValidator {
  rules: RedemptionSnapshotRule[];

  constructor(rules: RedemptionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionSnapshot): string[] {
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

  requireValid(item: RedemptionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionSnapshot[]): Map<string, string[]> {
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

export function defaultRedemptionSnapshotValidator(): RedemptionSnapshotValidator {
  return new RedemptionSnapshotValidator(
    [
      new RedemptionSnapshotCodePrefixRule("OPS"),
      new RedemptionSnapshotLabelLengthRule(255),
      new RedemptionSnapshotConversionRateRangeRule(7.4, 2067.5),
    ],
  );
}
