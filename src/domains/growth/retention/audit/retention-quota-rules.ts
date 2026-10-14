import * as text from "../../../../kit/text.js";
import { RetentionQuota } from "./retention-quota.js";

/** A rule a retention quota must pass. Check returns its problems, or none. */
export interface RetentionQuotaRule {
  check(item: RetentionQuota): string[];
}

export class RetentionQuotaAllowedNameRule implements RetentionQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class RetentionQuotaLabelLengthRule implements RetentionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionQuotaRequiredCodeRule implements RetentionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a retention quota. */
export class RetentionQuotaValidator {
  rules: RetentionQuotaRule[];

  constructor(rules: RetentionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionQuota): string[] {
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

  requireValid(item: RetentionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionQuota[]): Map<string, string[]> {
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

export function defaultRetentionQuotaValidator(): RetentionQuotaValidator {
  return new RetentionQuotaValidator(
    [
      new RetentionQuotaAllowedNameRule(["lenient", "fallback", "tiered"]),
      new RetentionQuotaLabelLengthRule(86400),
      new RetentionQuotaRequiredCodeRule("retention quota needs an entry"),
    ],
  );
}
