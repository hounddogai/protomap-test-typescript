import { LegacyConversionMetric } from "./legacy-conversion-metric.js";

/** A rule a legacy conversion metric must pass. Check returns its problems, or none. */
export interface LegacyConversionMetricRule {
  check(item: LegacyConversionMetric): string[];
}

export class LegacyConversionMetricRequiredCountryRule implements LegacyConversionMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyConversionMetric): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyConversionMetricFrequencyCapRangeRule implements LegacyConversionMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyConversionMetric): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyConversionMetricCampaignRefLengthRule implements LegacyConversionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyConversionMetric): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyConversionMetricCodeLengthRule implements LegacyConversionMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyConversionMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy conversion metric. */
export class LegacyConversionMetricValidator {
  rules: LegacyConversionMetricRule[];

  constructor(rules: LegacyConversionMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyConversionMetric): string[] {
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

  requireValid(item: LegacyConversionMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyConversionMetric[]): Map<string, string[]> {
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

export function defaultLegacyConversionMetricValidator(): LegacyConversionMetricValidator {
  return new LegacyConversionMetricValidator(
    [
      new LegacyConversionMetricRequiredCountryRule("legacy conversion metric needs an entry"),
      new LegacyConversionMetricFrequencyCapRangeRule(80, 120),
      new LegacyConversionMetricCampaignRefLengthRule(86400),
      new LegacyConversionMetricCodeLengthRule(64),
    ],
  );
}
