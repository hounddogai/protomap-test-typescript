import * as text from "../../../../kit/text.js";
import { CappedSenderQuota } from "./capped-sender-quota.js";

/** A rule a capped sender quota must pass. Check returns its problems, or none. */
export interface CappedSenderQuotaRule {
  check(item: CappedSenderQuota): string[];
}

export class CappedSenderQuotaCodeLengthRule implements CappedSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSenderQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSenderQuotaCodePrefixRule implements CappedSenderQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedSenderQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedSenderQuotaTitleLengthRule implements CappedSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSenderQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSenderQuotaRegionLengthRule implements CappedSenderQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSenderQuota): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSenderQuotaAmountRangeRule implements CappedSenderQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedSenderQuota): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedSenderQuotaAllowedCodeRule implements CappedSenderQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedSenderQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a capped sender quota. */
export class CappedSenderQuotaValidator {
  rules: CappedSenderQuotaRule[];

  constructor(rules: CappedSenderQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSenderQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSenderQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSenderQuota[]): Map<string, string[]> {
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

export function defaultCappedSenderQuotaValidator(): CappedSenderQuotaValidator {
  return new CappedSenderQuotaValidator(
    [
      new CappedSenderQuotaCodeLengthRule(86400),
      new CappedSenderQuotaCodePrefixRule("Q"),
      new CappedSenderQuotaTitleLengthRule(255),
      new CappedSenderQuotaRegionLengthRule(86400),
      new CappedSenderQuotaAmountRangeRule(2, 636.1),
      new CappedSenderQuotaAllowedCodeRule(["weighted", "scheduled"]),
    ],
  );
}
