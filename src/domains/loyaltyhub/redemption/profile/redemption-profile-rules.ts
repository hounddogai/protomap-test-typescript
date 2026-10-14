import { RedemptionProfile } from "./redemption-profile.js";

/** A rule a redemption profile must pass. Check returns its problems, or none. */
export interface RedemptionProfileRule {
  check(item: RedemptionProfile): string[];
}

export class RedemptionProfileRevisionRangeRule implements RedemptionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionProfile): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionProfileRequiredSummaryRule implements RedemptionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionProfile): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionProfileConversionRateRangeRule implements RedemptionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionProfile): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionProfileRequiredCodeRule implements RedemptionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionProfileLabelLengthRule implements RedemptionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionProfileCodePrefixRule implements RedemptionProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a redemption profile. */
export class RedemptionProfileValidator {
  rules: RedemptionProfileRule[];

  constructor(rules: RedemptionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionProfile): string[] {
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

  requireValid(item: RedemptionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionProfile[]): Map<string, string[]> {
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

export function defaultRedemptionProfileValidator(): RedemptionProfileValidator {
  return new RedemptionProfileValidator(
    [
      new RedemptionProfileRevisionRangeRule(16, 80),
      new RedemptionProfileRequiredSummaryRule("redemption profile needs an entry"),
      new RedemptionProfileConversionRateRangeRule(0.4, 3450.9),
      new RedemptionProfileRequiredCodeRule("redemption profile needs a value"),
      new RedemptionProfileLabelLengthRule(64),
      new RedemptionProfileCodePrefixRule("Q"),
    ],
  );
}
