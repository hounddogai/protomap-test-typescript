import * as text from "../../../../kit/text.js";
import { EnrollmentQuota } from "./enrollment-quota.js";

/** A rule a enrollment quota must pass. Check returns its problems, or none. */
export interface EnrollmentQuotaRule {
  check(item: EnrollmentQuota): string[];
}

export class EnrollmentQuotaVisibleGuardRule implements EnrollmentQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentQuota): string[] {
    if (item.visible && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class EnrollmentQuotaGraceDaysRangeRule implements EnrollmentQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentQuota): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentQuotaRequiredLabelRule implements EnrollmentQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentQuotaLabelLengthRule implements EnrollmentQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentQuotaAllowedLabelRule implements EnrollmentQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class EnrollmentQuotaCostRangeRule implements EnrollmentQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentQuota): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment quota. */
export class EnrollmentQuotaValidator {
  rules: EnrollmentQuotaRule[];

  constructor(rules: EnrollmentQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentQuota): string[] {
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

  requireValid(item: EnrollmentQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentQuota[]): Map<string, string[]> {
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

export function defaultEnrollmentQuotaValidator(): EnrollmentQuotaValidator {
  return new EnrollmentQuotaValidator(
    [
      new EnrollmentQuotaVisibleGuardRule(32),
      new EnrollmentQuotaGraceDaysRangeRule(32, 1000),
      new EnrollmentQuotaRequiredLabelRule("enrollment quota needs an entry"),
      new EnrollmentQuotaLabelLengthRule(3600),
      new EnrollmentQuotaAllowedLabelRule(["seasonal", "manual"]),
      new EnrollmentQuotaCostRangeRule(4.3, 3738.4),
    ],
  );
}
