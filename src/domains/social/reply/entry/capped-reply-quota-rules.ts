import { CappedReplyQuota } from "./capped-reply-quota.js";

/** A rule a capped reply quota must pass. Check returns its problems, or none. */
export interface CappedReplyQuotaRule {
  check(item: CappedReplyQuota): string[];
}

export class CappedReplyQuotaCodePrefixRule implements CappedReplyQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedReplyQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedReplyQuotaCodeLengthRule implements CappedReplyQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedReplyQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedReplyQuotaRatioRangeRule implements CappedReplyQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedReplyQuota): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped reply quota. */
export class CappedReplyQuotaValidator {
  rules: CappedReplyQuotaRule[];

  constructor(rules: CappedReplyQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: CappedReplyQuota): string[] {
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

  requireValid(item: CappedReplyQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedReplyQuota[]): Map<string, string[]> {
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

export function defaultCappedReplyQuotaValidator(): CappedReplyQuotaValidator {
  return new CappedReplyQuotaValidator(
    [
      new CappedReplyQuotaCodePrefixRule("REF"),
      new CappedReplyQuotaCodeLengthRule(3600),
      new CappedReplyQuotaRatioRangeRule(8.8, 2810.3),
    ],
  );
}
