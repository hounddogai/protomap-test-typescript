import { ScheduledBounceQuota } from "./scheduled-bounce-quota.js";

/** A rule a scheduled bounce quota must pass. Check returns its problems, or none. */
export interface ScheduledBounceQuotaRule {
  check(item: ScheduledBounceQuota): string[];
}

export class ScheduledBounceQuotaBidRangeRule implements ScheduledBounceQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBounceQuota): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledBounceQuotaRequiredUtmSourceRule implements ScheduledBounceQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBounceQuota): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBounceQuotaCodeLengthRule implements ScheduledBounceQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBounceQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBounceQuotaExpiresAtRangeRule implements ScheduledBounceQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBounceQuota): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledBounceQuotaWeightRangeRule implements ScheduledBounceQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBounceQuota): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled bounce quota. */
export class ScheduledBounceQuotaValidator {
  rules: ScheduledBounceQuotaRule[];

  constructor(rules: ScheduledBounceQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBounceQuota): string[] {
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

  requireValid(item: ScheduledBounceQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBounceQuota[]): Map<string, string[]> {
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

export function defaultScheduledBounceQuotaValidator(): ScheduledBounceQuotaValidator {
  return new ScheduledBounceQuotaValidator(
    [
      new ScheduledBounceQuotaBidRangeRule(8, 4359.5),
      new ScheduledBounceQuotaRequiredUtmSourceRule("scheduled bounce quota needs an entry"),
      new ScheduledBounceQuotaCodeLengthRule(64),
      new ScheduledBounceQuotaExpiresAtRangeRule(16, 3600),
      new ScheduledBounceQuotaWeightRangeRule(8.8, 362.8),
    ],
  );
}
