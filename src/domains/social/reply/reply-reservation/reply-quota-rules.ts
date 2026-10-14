import { ReplyQuota } from "./reply-quota.js";

/** A rule a reply quota must pass. Check returns its problems, or none. */
export interface ReplyQuotaRule {
  check(item: ReplyQuota): string[];
}

export class ReplyQuotaRequiredSummaryRule implements ReplyQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyQuota): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyQuotaRequiredCodeRule implements ReplyQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyQuotaCodePrefixRule implements ReplyQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyQuotaLabelLengthRule implements ReplyQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyQuotaBidRangeRule implements ReplyQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyQuota): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyQuotaCodeLengthRule implements ReplyQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply quota. */
export class ReplyQuotaValidator {
  rules: ReplyQuotaRule[];

  constructor(rules: ReplyQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyQuota): string[] {
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

  requireValid(item: ReplyQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyQuota[]): Map<string, string[]> {
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

export function defaultReplyQuotaValidator(): ReplyQuotaValidator {
  return new ReplyQuotaValidator(
    [
      new ReplyQuotaRequiredSummaryRule("reply quota needs a value"),
      new ReplyQuotaRequiredCodeRule("reply quota needs this field"),
      new ReplyQuotaCodePrefixRule("OPS"),
      new ReplyQuotaLabelLengthRule(255),
      new ReplyQuotaBidRangeRule(6.9, 2259.9),
      new ReplyQuotaCodeLengthRule(32),
    ],
  );
}
