import { AdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

/** A rule a adaptive conversion quota must pass. Check returns its problems, or none. */
export interface AdaptiveConversionQuotaRule {
  check(item: AdaptiveConversionQuota): string[];
}

export class AdaptiveConversionQuotaTitleLengthRule implements AdaptiveConversionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveConversionQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveConversionQuotaMaximumRangeRule implements AdaptiveConversionQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveConversionQuota): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveConversionQuotaRequiredCurrencyRule implements AdaptiveConversionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveConversionQuota): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive conversion quota. */
export class AdaptiveConversionQuotaValidator {
  rules: AdaptiveConversionQuotaRule[];

  constructor(rules: AdaptiveConversionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveConversionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveConversionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveConversionQuota[]): Map<string, string[]> {
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

export function defaultAdaptiveConversionQuotaValidator(): AdaptiveConversionQuotaValidator {
  return new AdaptiveConversionQuotaValidator(
    [
      new AdaptiveConversionQuotaTitleLengthRule(1000),
      new AdaptiveConversionQuotaMaximumRangeRule(0.7, 414.3),
      new AdaptiveConversionQuotaRequiredCurrencyRule("adaptive conversion quota needs an entry"),
    ],
  );
}
