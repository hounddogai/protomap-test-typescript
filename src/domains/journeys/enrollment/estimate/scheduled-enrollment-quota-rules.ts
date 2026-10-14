import * as text from "../../../../kit/text.js";
import { ScheduledEnrollmentQuota } from "./scheduled-enrollment-quota.js";

/** A rule a scheduled enrollment quota must pass. Check returns its problems, or none. */
export interface ScheduledEnrollmentQuotaRule {
  check(item: ScheduledEnrollmentQuota): string[];
}

export class ScheduledEnrollmentQuotaOwnerIdLengthRule implements ScheduledEnrollmentQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledEnrollmentQuota): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledEnrollmentQuotaPriorityRangeRule implements ScheduledEnrollmentQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledEnrollmentQuota): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledEnrollmentQuotaAllowedCountryRule implements ScheduledEnrollmentQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledEnrollmentQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is above maximum`];
    return [];
  }
}

export class ScheduledEnrollmentQuotaRatioRangeRule implements ScheduledEnrollmentQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledEnrollmentQuota): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledEnrollmentQuotaCodeLengthRule implements ScheduledEnrollmentQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledEnrollmentQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled enrollment quota. */
export class ScheduledEnrollmentQuotaValidator {
  rules: ScheduledEnrollmentQuotaRule[];

  constructor(rules: ScheduledEnrollmentQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledEnrollmentQuota): string[] {
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

  requireValid(item: ScheduledEnrollmentQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledEnrollmentQuota[]): Map<string, string[]> {
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

export function defaultScheduledEnrollmentQuotaValidator(): ScheduledEnrollmentQuotaValidator {
  return new ScheduledEnrollmentQuotaValidator(
    [
      new ScheduledEnrollmentQuotaOwnerIdLengthRule(1000),
      new ScheduledEnrollmentQuotaPriorityRangeRule(16, 3600),
      new ScheduledEnrollmentQuotaAllowedCountryRule(["tiered", "regional"]),
      new ScheduledEnrollmentQuotaRatioRangeRule(4.1, 135.4),
      new ScheduledEnrollmentQuotaCodeLengthRule(255),
    ],
  );
}
