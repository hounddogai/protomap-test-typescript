import { CreditQuota } from "./credit-quota.js";

/** A rule a credit quota must pass. Check returns its problems, or none. */
export interface CreditQuotaRule {
  check(item: CreditQuota): string[];
}

export class CreditQuotaRequiredDescriptionRule implements CreditQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditQuota): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class CreditQuotaAmountRangeRule implements CreditQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditQuota): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditQuotaTagsLimitRule implements CreditQuotaRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CreditQuota): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a credit quota. */
export class CreditQuotaValidator {
  rules: CreditQuotaRule[];

  constructor(rules: CreditQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CreditQuota): string[] {
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

  requireValid(item: CreditQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditQuota[]): Map<string, string[]> {
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

export function defaultCreditQuotaValidator(): CreditQuotaValidator {
  return new CreditQuotaValidator(
    [
      new CreditQuotaRequiredDescriptionRule("credit quota needs this field"),
      new CreditQuotaAmountRangeRule(7.2, 4615.2),
      new CreditQuotaTagsLimitRule(120, []),
    ],
  );
}
