import { BadgeQuota } from "./badge-quota.js";

/** A rule a badge quota must pass. Check returns its problems, or none. */
export interface BadgeQuotaRule {
  check(item: BadgeQuota): string[];
}

export class BadgeQuotaRequiredOwnerIdRule implements BadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeQuota): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeQuotaRequiredTitleRule implements BadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeQuotaRequiredCodeRule implements BadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeQuotaCodeLengthRule implements BadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeQuotaBidRangeRule implements BadgeQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeQuota): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a badge quota. */
export class BadgeQuotaValidator {
  rules: BadgeQuotaRule[];

  constructor(rules: BadgeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeQuota): string[] {
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

  requireValid(item: BadgeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeQuota[]): Map<string, string[]> {
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

export function defaultBadgeQuotaValidator(): BadgeQuotaValidator {
  return new BadgeQuotaValidator(
    [
      new BadgeQuotaRequiredOwnerIdRule("badge quota needs this field"),
      new BadgeQuotaRequiredTitleRule("badge quota needs an entry"),
      new BadgeQuotaRequiredCodeRule("badge quota needs this field"),
      new BadgeQuotaCodeLengthRule(3600),
      new BadgeQuotaBidRangeRule(8.8, 1916.4),
    ],
  );
}
