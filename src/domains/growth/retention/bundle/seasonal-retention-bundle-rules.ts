import { SeasonalRetentionBundle } from "./seasonal-retention-bundle.js";

/** A rule a seasonal retention bundle must pass. Check returns its problems, or none. */
export interface SeasonalRetentionBundleRule {
  check(item: SeasonalRetentionBundle): string[];
}

export class SeasonalRetentionBundleRequiredNameRule implements SeasonalRetentionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRetentionBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRetentionBundleConversionRateRangeRule implements SeasonalRetentionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRetentionBundle): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalRetentionBundleSummaryLengthRule implements SeasonalRetentionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRetentionBundle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal retention bundle. */
export class SeasonalRetentionBundleValidator {
  rules: SeasonalRetentionBundleRule[];

  constructor(rules: SeasonalRetentionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRetentionBundle): string[] {
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

  requireValid(item: SeasonalRetentionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRetentionBundle[]): Map<string, string[]> {
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

export function defaultSeasonalRetentionBundleValidator(): SeasonalRetentionBundleValidator {
  return new SeasonalRetentionBundleValidator(
    [
      new SeasonalRetentionBundleRequiredNameRule("seasonal retention bundle needs a value"),
      new SeasonalRetentionBundleConversionRateRangeRule(9.9, 706.7),
      new SeasonalRetentionBundleSummaryLengthRule(120),
    ],
  );
}
