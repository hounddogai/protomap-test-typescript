import { GlobalBadgeBaseline } from "./global-badge-baseline.js";

/** A rule a global badge baseline must pass. Check returns its problems, or none. */
export interface GlobalBadgeBaselineRule {
  check(item: GlobalBadgeBaseline): string[];
}

export class GlobalBadgeBaselineImpressionsRangeRule implements GlobalBadgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBadgeBaseline): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalBadgeBaselineRequiredExternalRefRule implements GlobalBadgeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBadgeBaseline): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBadgeBaselineCurrencyLengthRule implements GlobalBadgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBadgeBaseline): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBadgeBaselineCodePrefixRule implements GlobalBadgeBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalBadgeBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalBadgeBaselineExternalRefLengthRule implements GlobalBadgeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalBadgeBaseline): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalBadgeBaselineRateRangeRule implements GlobalBadgeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBadgeBaseline): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global badge baseline. */
export class GlobalBadgeBaselineValidator {
  rules: GlobalBadgeBaselineRule[];

  constructor(rules: GlobalBadgeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBadgeBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalBadgeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBadgeBaseline[]): Map<string, string[]> {
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

export function defaultGlobalBadgeBaselineValidator(): GlobalBadgeBaselineValidator {
  return new GlobalBadgeBaselineValidator(
    [
      new GlobalBadgeBaselineImpressionsRangeRule(80, 3600),
      new GlobalBadgeBaselineRequiredExternalRefRule("global badge baseline needs this field"),
      new GlobalBadgeBaselineCurrencyLengthRule(255),
      new GlobalBadgeBaselineCodePrefixRule("Q"),
      new GlobalBadgeBaselineExternalRefLengthRule(120),
      new GlobalBadgeBaselineRateRangeRule(2.2, 3097.4),
    ],
  );
}
