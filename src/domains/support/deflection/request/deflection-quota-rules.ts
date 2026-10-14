import * as text from "../../../../kit/text.js";
import { DeflectionQuota } from "./deflection-quota.js";

/** A rule a deflection quota must pass. Check returns its problems, or none. */
export interface DeflectionQuotaRule {
  check(item: DeflectionQuota): string[];
}

export class DeflectionQuotaCodeLengthRule implements DeflectionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionQuotaAllowedTitleRule implements DeflectionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class DeflectionQuotaTitleLengthRule implements DeflectionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionQuotaActiveGuardRule implements DeflectionQuotaRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionQuota): string[] {
    if (item.active && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a deflection quota. */
export class DeflectionQuotaValidator {
  rules: DeflectionQuotaRule[];

  constructor(rules: DeflectionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionQuota[]): Map<string, string[]> {
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

export function defaultDeflectionQuotaValidator(): DeflectionQuotaValidator {
  return new DeflectionQuotaValidator(
    [
      new DeflectionQuotaCodeLengthRule(3600),
      new DeflectionQuotaAllowedTitleRule(["seasonal", "weighted"]),
      new DeflectionQuotaTitleLengthRule(255),
      new DeflectionQuotaActiveGuardRule(9.9),
    ],
  );
}
