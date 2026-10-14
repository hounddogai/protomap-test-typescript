import * as text from "../../../../kit/text.js";
import { ScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

/** A rule a scheduled bid rule quota must pass. Check returns its problems, or none. */
export interface ScheduledBidRuleQuotaRule {
  check(item: ScheduledBidRuleQuota): string[];
}

export class ScheduledBidRuleQuotaAllowedCodeRule implements ScheduledBidRuleQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledBidRuleQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class ScheduledBidRuleQuotaRequiredChecksumRule implements ScheduledBidRuleQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBidRuleQuota): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBidRuleQuotaNameLengthRule implements ScheduledBidRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBidRuleQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBidRuleQuotaChecksumLengthRule implements ScheduledBidRuleQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBidRuleQuota): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled bid rule quota. */
export class ScheduledBidRuleQuotaValidator {
  rules: ScheduledBidRuleQuotaRule[];

  constructor(rules: ScheduledBidRuleQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBidRuleQuota): string[] {
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

  requireValid(item: ScheduledBidRuleQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBidRuleQuota[]): Map<string, string[]> {
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

export function defaultScheduledBidRuleQuotaValidator(): ScheduledBidRuleQuotaValidator {
  return new ScheduledBidRuleQuotaValidator(
    [
      new ScheduledBidRuleQuotaAllowedCodeRule(["lenient"]),
      new ScheduledBidRuleQuotaRequiredChecksumRule("scheduled bid rule quota needs this field"),
      new ScheduledBidRuleQuotaNameLengthRule(16),
      new ScheduledBidRuleQuotaChecksumLengthRule(80),
    ],
  );
}
