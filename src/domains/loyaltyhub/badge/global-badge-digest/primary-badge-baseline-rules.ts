import { PrimaryBadgeBaseline } from "./primary-badge-baseline.js";

/** A rule a primary badge baseline must pass. Check returns its problems, or none. */
export interface PrimaryBadgeBaselineRule {
  check(item: PrimaryBadgeBaseline): string[];
}

export class PrimaryBadgeBaselineConversionRateRangeRule implements PrimaryBadgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryBadgeBaseline): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryBadgeBaselineCodePrefixRule implements PrimaryBadgeBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryBadgeBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryBadgeBaselinePhoneLengthRule implements PrimaryBadgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBadgeBaseline): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBadgeBaselineCodeLengthRule implements PrimaryBadgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryBadgeBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryBadgeBaselineRequiredNameRule implements PrimaryBadgeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBadgeBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryBadgeBaselineRequiredCodeRule implements PrimaryBadgeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryBadgeBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary badge baseline. */
export class PrimaryBadgeBaselineValidator {
  rules: PrimaryBadgeBaselineRule[];

  constructor(rules: PrimaryBadgeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryBadgeBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryBadgeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryBadgeBaseline[]): Map<string, string[]> {
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

export function defaultPrimaryBadgeBaselineValidator(): PrimaryBadgeBaselineValidator {
  return new PrimaryBadgeBaselineValidator(
    [
      new PrimaryBadgeBaselineConversionRateRangeRule(0.8, 3152.3),
      new PrimaryBadgeBaselineCodePrefixRule("Q"),
      new PrimaryBadgeBaselinePhoneLengthRule(80),
      new PrimaryBadgeBaselineCodeLengthRule(3600),
      new PrimaryBadgeBaselineRequiredNameRule("primary badge baseline needs a value"),
      new PrimaryBadgeBaselineRequiredCodeRule("primary badge baseline needs a value"),
    ],
  );
}
