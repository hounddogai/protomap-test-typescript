import * as text from "../../../../kit/text.js";
import { WaitQuota } from "./wait-quota.js";

/** A rule a wait quota must pass. Check returns its problems, or none. */
export interface WaitQuotaRule {
  check(item: WaitQuota): string[];
}

export class WaitQuotaTitleLengthRule implements WaitQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitQuotaRequiredExternalRefRule implements WaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitQuota): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class WaitQuotaMaximumRangeRule implements WaitQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitQuota): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitQuotaRequiredCodeRule implements WaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitQuotaAllowedCodeRule implements WaitQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class WaitQuotaRequiredTitleRule implements WaitQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait quota. */
export class WaitQuotaValidator {
  rules: WaitQuotaRule[];

  constructor(rules: WaitQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: WaitQuota): string[] {
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

  requireValid(item: WaitQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitQuota[]): Map<string, string[]> {
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

export function defaultWaitQuotaValidator(): WaitQuotaValidator {
  return new WaitQuotaValidator(
    [
      new WaitQuotaTitleLengthRule(120),
      new WaitQuotaRequiredExternalRefRule("wait quota needs this field"),
      new WaitQuotaMaximumRangeRule(7.7, 3115),
      new WaitQuotaRequiredCodeRule("wait quota needs this field"),
      new WaitQuotaAllowedCodeRule(["capped", "manual", "regional"]),
      new WaitQuotaRequiredTitleRule("wait quota needs an entry"),
    ],
  );
}
