import { LegacyFrequencyThreshold } from "./legacy-frequency-threshold.js";

/** A rule a legacy frequency threshold must pass. Check returns its problems, or none. */
export interface LegacyFrequencyThresholdRule {
  check(item: LegacyFrequencyThreshold): string[];
}

export class LegacyFrequencyThresholdRevisionRangeRule implements LegacyFrequencyThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFrequencyThreshold): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFrequencyThresholdConversionRateRangeRule implements LegacyFrequencyThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFrequencyThreshold): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyFrequencyThresholdRequiredTitleRule implements LegacyFrequencyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFrequencyThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFrequencyThresholdCodePrefixRule implements LegacyFrequencyThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyFrequencyThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyFrequencyThresholdTitleLengthRule implements LegacyFrequencyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFrequencyThresholdCodeLengthRule implements LegacyFrequencyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFrequencyThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy frequency threshold. */
export class LegacyFrequencyThresholdValidator {
  rules: LegacyFrequencyThresholdRule[];

  constructor(rules: LegacyFrequencyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFrequencyThreshold): string[] {
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

  requireValid(item: LegacyFrequencyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFrequencyThreshold[]): Map<string, string[]> {
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

export function defaultLegacyFrequencyThresholdValidator(): LegacyFrequencyThresholdValidator {
  return new LegacyFrequencyThresholdValidator(
    [
      new LegacyFrequencyThresholdRevisionRangeRule(120, 255),
      new LegacyFrequencyThresholdConversionRateRangeRule(9.2, 3093.5),
      new LegacyFrequencyThresholdRequiredTitleRule("legacy frequency threshold needs a value"),
      new LegacyFrequencyThresholdCodePrefixRule("ACM"),
      new LegacyFrequencyThresholdTitleLengthRule(80),
      new LegacyFrequencyThresholdCodeLengthRule(1000),
    ],
  );
}
