import * as text from "../../../../kit/text.js";
import { StrictBounceQuota } from "./strict-bounce-quota.js";

/** A rule a strict bounce quota must pass. Check returns its problems, or none. */
export interface StrictBounceQuotaRule {
  check(item: StrictBounceQuota): string[];
}

export class StrictBounceQuotaBudgetRangeRule implements StrictBounceQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBounceQuota): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictBounceQuotaMinimumRangeRule implements StrictBounceQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictBounceQuota): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictBounceQuotaAllowedCodeRule implements StrictBounceQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictBounceQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class StrictBounceQuotaCodeLengthRule implements StrictBounceQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBounceQuotaRequiredSummaryRule implements StrictBounceQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBounceQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict bounce quota. */
export class StrictBounceQuotaValidator {
  rules: StrictBounceQuotaRule[];

  constructor(rules: StrictBounceQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBounceQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictBounceQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBounceQuota[]): Map<string, string[]> {
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

export function defaultStrictBounceQuotaValidator(): StrictBounceQuotaValidator {
  return new StrictBounceQuotaValidator(
    [
      new StrictBounceQuotaBudgetRangeRule(1.1, 458.9),
      new StrictBounceQuotaMinimumRangeRule(2.7, 1048.8),
      new StrictBounceQuotaAllowedCodeRule(["batched"]),
      new StrictBounceQuotaCodeLengthRule(80),
      new StrictBounceQuotaRequiredSummaryRule("strict bounce quota needs this field"),
    ],
  );
}
