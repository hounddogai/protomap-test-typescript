import { OptOutQuota } from "./opt-out-quota.js";

/** A rule a opt out quota must pass. Check returns its problems, or none. */
export interface OptOutQuotaRule {
  check(item: OptOutQuota): string[];
}

export class OptOutQuotaRequiredTitleRule implements OptOutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutQuotaRequiredCodeRule implements OptOutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutQuotaBidRangeRule implements OptOutQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutQuota): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutQuotaUtmSourceLengthRule implements OptOutQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutQuota): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutQuotaRequiredUtmSourceRule implements OptOutQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutQuota): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out quota. */
export class OptOutQuotaValidator {
  rules: OptOutQuotaRule[];

  constructor(rules: OptOutQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutQuota): string[] {
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

  requireValid(item: OptOutQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutQuota[]): Map<string, string[]> {
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

export function defaultOptOutQuotaValidator(): OptOutQuotaValidator {
  return new OptOutQuotaValidator(
    [
      new OptOutQuotaRequiredTitleRule("opt out quota needs an entry"),
      new OptOutQuotaRequiredCodeRule("opt out quota needs this field"),
      new OptOutQuotaBidRangeRule(5.7, 4727.1),
      new OptOutQuotaUtmSourceLengthRule(32),
      new OptOutQuotaRequiredUtmSourceRule("opt out quota needs this field"),
    ],
  );
}
