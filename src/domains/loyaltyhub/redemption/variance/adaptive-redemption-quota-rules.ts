import { AdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

/** A rule a adaptive redemption quota must pass. Check returns its problems, or none. */
export interface AdaptiveRedemptionQuotaRule {
  check(item: AdaptiveRedemptionQuota): string[];
}

export class AdaptiveRedemptionQuotaVersionRangeRule implements AdaptiveRedemptionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRedemptionQuota): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveRedemptionQuotaCodePrefixRule implements AdaptiveRedemptionQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveRedemptionQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveRedemptionQuotaRequiredSummaryRule implements AdaptiveRedemptionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRedemptionQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRedemptionQuotaOpenRateRangeRule implements AdaptiveRedemptionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRedemptionQuota): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveRedemptionQuotaSummaryLengthRule implements AdaptiveRedemptionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionQuota): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive redemption quota. */
export class AdaptiveRedemptionQuotaValidator {
  rules: AdaptiveRedemptionQuotaRule[];

  constructor(rules: AdaptiveRedemptionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRedemptionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveRedemptionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRedemptionQuota[]): Map<string, string[]> {
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

export function defaultAdaptiveRedemptionQuotaValidator(): AdaptiveRedemptionQuotaValidator {
  return new AdaptiveRedemptionQuotaValidator(
    [
      new AdaptiveRedemptionQuotaVersionRangeRule(120, 1000),
      new AdaptiveRedemptionQuotaCodePrefixRule("X"),
      new AdaptiveRedemptionQuotaRequiredSummaryRule("adaptive redemption quota needs an entry"),
      new AdaptiveRedemptionQuotaOpenRateRangeRule(7.8, 2584.9),
      new AdaptiveRedemptionQuotaSummaryLengthRule(1000),
    ],
  );
}
