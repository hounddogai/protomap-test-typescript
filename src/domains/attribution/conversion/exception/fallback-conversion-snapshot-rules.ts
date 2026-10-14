import { FallbackConversionSnapshot } from "./fallback-conversion-snapshot.js";

/** A rule a fallback conversion snapshot must pass. Check returns its problems, or none. */
export interface FallbackConversionSnapshotRule {
  check(item: FallbackConversionSnapshot): string[];
}

export class FallbackConversionSnapshotRequiredCampaignRefRule implements FallbackConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackConversionSnapshot): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackConversionSnapshotClicksRangeRule implements FallbackConversionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackConversionSnapshot): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackConversionSnapshotCampaignRefLengthRule implements FallbackConversionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackConversionSnapshot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackConversionSnapshotCodePrefixRule implements FallbackConversionSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackConversionSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback conversion snapshot. */
export class FallbackConversionSnapshotValidator {
  rules: FallbackConversionSnapshotRule[];

  constructor(rules: FallbackConversionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackConversionSnapshot): string[] {
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

  requireValid(item: FallbackConversionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackConversionSnapshot[]): Map<string, string[]> {
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

export function defaultFallbackConversionSnapshotValidator(): FallbackConversionSnapshotValidator {
  return new FallbackConversionSnapshotValidator(
    [
      new FallbackConversionSnapshotRequiredCampaignRefRule("fallback conversion snapshot needs this field"),
      new FallbackConversionSnapshotClicksRangeRule(64, 86400),
      new FallbackConversionSnapshotCampaignRefLengthRule(32),
      new FallbackConversionSnapshotCodePrefixRule("OPS"),
    ],
  );
}
