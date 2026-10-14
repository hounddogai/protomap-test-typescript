import * as text from "../../../../kit/text.js";
import { RegionalBadgeQuota } from "./regional-badge-quota.js";

/** A rule a regional badge quota must pass. Check returns its problems, or none. */
export interface RegionalBadgeQuotaRule {
  check(item: RegionalBadgeQuota): string[];
}

export class RegionalBadgeQuotaAllowedLocaleRule implements RegionalBadgeQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalBadgeQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is missing`];
    return [];
  }
}

export class RegionalBadgeQuotaNameLengthRule implements RegionalBadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBadgeQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBadgeQuotaRequiredNameRule implements RegionalBadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalBadgeQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalBadgeQuotaCodePrefixRule implements RegionalBadgeQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalBadgeQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalBadgeQuotaCodeLengthRule implements RegionalBadgeQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBadgeQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBadgeQuotaRequiredLocaleRule implements RegionalBadgeQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalBadgeQuota): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional badge quota. */
export class RegionalBadgeQuotaValidator {
  rules: RegionalBadgeQuotaRule[];

  constructor(rules: RegionalBadgeQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBadgeQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalBadgeQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBadgeQuota[]): Map<string, string[]> {
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

export function defaultRegionalBadgeQuotaValidator(): RegionalBadgeQuotaValidator {
  return new RegionalBadgeQuotaValidator(
    [
      new RegionalBadgeQuotaAllowedLocaleRule(["batched"]),
      new RegionalBadgeQuotaNameLengthRule(120),
      new RegionalBadgeQuotaRequiredNameRule("regional badge quota needs a value"),
      new RegionalBadgeQuotaCodePrefixRule("OPS"),
      new RegionalBadgeQuotaCodeLengthRule(255),
      new RegionalBadgeQuotaRequiredLocaleRule("regional badge quota needs this field"),
    ],
  );
}
