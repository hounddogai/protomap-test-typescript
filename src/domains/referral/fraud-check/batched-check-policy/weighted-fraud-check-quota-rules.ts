import * as text from "../../../../kit/text.js";
import { WeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

/** A rule a weighted fraud check quota must pass. Check returns its problems, or none. */
export interface WeightedFraudCheckQuotaRule {
  check(item: WeightedFraudCheckQuota): string[];
}

export class WeightedFraudCheckQuotaConversionRateRangeRule implements WeightedFraudCheckQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedFraudCheckQuota): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedFraudCheckQuotaLabelLengthRule implements WeightedFraudCheckQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFraudCheckQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFraudCheckQuotaTitleLengthRule implements WeightedFraudCheckQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFraudCheckQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFraudCheckQuotaCodeLengthRule implements WeightedFraudCheckQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedFraudCheckQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedFraudCheckQuotaAllowedTitleRule implements WeightedFraudCheckQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedFraudCheckQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

/** Runs every rule of a weighted fraud check quota. */
export class WeightedFraudCheckQuotaValidator {
  rules: WeightedFraudCheckQuotaRule[];

  constructor(rules: WeightedFraudCheckQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedFraudCheckQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedFraudCheckQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedFraudCheckQuota[]): Map<string, string[]> {
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

export function defaultWeightedFraudCheckQuotaValidator(): WeightedFraudCheckQuotaValidator {
  return new WeightedFraudCheckQuotaValidator(
    [
      new WeightedFraudCheckQuotaConversionRateRangeRule(4.6, 1231.1),
      new WeightedFraudCheckQuotaLabelLengthRule(64),
      new WeightedFraudCheckQuotaTitleLengthRule(80),
      new WeightedFraudCheckQuotaCodeLengthRule(32),
      new WeightedFraudCheckQuotaAllowedTitleRule(["strict"]),
    ],
  );
}
