import { LegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

/** A rule a legacy paywall threshold must pass. Check returns its problems, or none. */
export interface LegacyPaywallThresholdRule {
  check(item: LegacyPaywallThreshold): string[];
}

export class LegacyPaywallThresholdCodeLengthRule implements LegacyPaywallThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPaywallThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPaywallThresholdImpressionsRangeRule implements LegacyPaywallThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPaywallThreshold): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyPaywallThresholdRateRangeRule implements LegacyPaywallThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPaywallThreshold): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy paywall threshold. */
export class LegacyPaywallThresholdValidator {
  rules: LegacyPaywallThresholdRule[];

  constructor(rules: LegacyPaywallThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPaywallThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyPaywallThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPaywallThreshold[]): Map<string, string[]> {
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

export function defaultLegacyPaywallThresholdValidator(): LegacyPaywallThresholdValidator {
  return new LegacyPaywallThresholdValidator(
    [
      new LegacyPaywallThresholdCodeLengthRule(120),
      new LegacyPaywallThresholdImpressionsRangeRule(64, 255),
      new LegacyPaywallThresholdRateRangeRule(6.9, 3083.9),
    ],
  );
}
