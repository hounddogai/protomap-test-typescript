import * as text from "../../../../kit/text.js";
import { ReplyNotice } from "./reply-notice.js";

/** A rule a reply notice must pass. Check returns its problems, or none. */
export interface ReplyNoticeRule {
  check(item: ReplyNotice): string[];
}

export class ReplyNoticeRequiredCodeRule implements ReplyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyNoticeCodePrefixRule implements ReplyNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyNoticeRequiredLabelRule implements ReplyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyNoticeRequiredCurrencyRule implements ReplyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyNotice): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyNoticeWeightRangeRule implements ReplyNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyNotice): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyNoticeAllowedCurrencyRule implements ReplyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is not allowed`];
    return [];
  }
}

/** Runs every rule of a reply notice. */
export class ReplyNoticeValidator {
  rules: ReplyNoticeRule[];

  constructor(rules: ReplyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyNotice): string[] {
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

  requireValid(item: ReplyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyNotice[]): Map<string, string[]> {
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

export function defaultReplyNoticeValidator(): ReplyNoticeValidator {
  return new ReplyNoticeValidator(
    [
      new ReplyNoticeRequiredCodeRule("reply notice needs this field"),
      new ReplyNoticeCodePrefixRule("ACM"),
      new ReplyNoticeRequiredLabelRule("reply notice needs an entry"),
      new ReplyNoticeRequiredCurrencyRule("reply notice needs an entry"),
      new ReplyNoticeWeightRangeRule(3, 1846.7),
      new ReplyNoticeAllowedCurrencyRule([]),
    ],
  );
}
