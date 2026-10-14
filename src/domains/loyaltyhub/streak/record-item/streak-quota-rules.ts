import * as text from "../../../../kit/text.js";
import { StreakQuota } from "./streak-quota.js";

/** A rule a streak quota must pass. Check returns its problems, or none. */
export interface StreakQuotaRule {
  check(item: StreakQuota): string[];
}

export class StreakQuotaRequiredCodeRule implements StreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakQuotaLabelLengthRule implements StreakQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakQuotaAllowedLabelRule implements StreakQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class StreakQuotaRequiredLocaleRule implements StreakQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakQuota): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class StreakQuotaStartsAtRangeRule implements StreakQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakQuota): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakQuotaContactEmailLengthRule implements StreakQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakQuota): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak quota. */
export class StreakQuotaValidator {
  rules: StreakQuotaRule[];

  constructor(rules: StreakQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: StreakQuota): string[] {
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

  requireValid(item: StreakQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakQuota[]): Map<string, string[]> {
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

export function defaultStreakQuotaValidator(): StreakQuotaValidator {
  return new StreakQuotaValidator(
    [
      new StreakQuotaRequiredCodeRule("streak quota needs an entry"),
      new StreakQuotaLabelLengthRule(86400),
      new StreakQuotaAllowedLabelRule([]),
      new StreakQuotaRequiredLocaleRule("streak quota needs an entry"),
      new StreakQuotaStartsAtRangeRule(32, 3600),
      new StreakQuotaContactEmailLengthRule(1000),
    ],
  );
}
