import { FallbackSubscriptionQuota } from "./fallback-subscription-quota.js";

/** A rule a fallback subscription quota must pass. Check returns its problems, or none. */
export interface FallbackSubscriptionQuotaRule {
  check(item: FallbackSubscriptionQuota): string[];
}

export class FallbackSubscriptionQuotaRequiredReviewerRule implements FallbackSubscriptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionQuota): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionQuotaCodeLengthRule implements FallbackSubscriptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSubscriptionQuotaRequiredCountryRule implements FallbackSubscriptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionQuota): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionQuotaAttemptsRangeRule implements FallbackSubscriptionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSubscriptionQuota): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback subscription quota. */
export class FallbackSubscriptionQuotaValidator {
  rules: FallbackSubscriptionQuotaRule[];

  constructor(rules: FallbackSubscriptionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSubscriptionQuota): string[] {
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

  requireValid(item: FallbackSubscriptionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSubscriptionQuota[]): Map<string, string[]> {
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

export function defaultFallbackSubscriptionQuotaValidator(): FallbackSubscriptionQuotaValidator {
  return new FallbackSubscriptionQuotaValidator(
    [
      new FallbackSubscriptionQuotaRequiredReviewerRule("fallback subscription quota needs a value"),
      new FallbackSubscriptionQuotaCodeLengthRule(120),
      new FallbackSubscriptionQuotaRequiredCountryRule("fallback subscription quota needs an entry"),
      new FallbackSubscriptionQuotaAttemptsRangeRule(64, 64),
    ],
  );
}
