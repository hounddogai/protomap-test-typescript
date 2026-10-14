import * as text from "../../../../kit/text.js";
import { BatchedFunnelNotice } from "./batched-funnel-notice.js";

/** A rule a batched funnel notice must pass. Check returns its problems, or none. */
export interface BatchedFunnelNoticeRule {
  check(item: BatchedFunnelNotice): string[];
}

export class BatchedFunnelNoticeLabelLengthRule implements BatchedFunnelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFunnelNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFunnelNoticeCodePrefixRule implements BatchedFunnelNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFunnelNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFunnelNoticeOpenRateRangeRule implements BatchedFunnelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFunnelNotice): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedFunnelNoticeCodeLengthRule implements BatchedFunnelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFunnelNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFunnelNoticeRequiredCodeRule implements BatchedFunnelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFunnelNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFunnelNoticeAllowedTitleRule implements BatchedFunnelNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFunnelNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

/** Runs every rule of a batched funnel notice. */
export class BatchedFunnelNoticeValidator {
  rules: BatchedFunnelNoticeRule[];

  constructor(rules: BatchedFunnelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFunnelNotice): string[] {
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

  requireValid(item: BatchedFunnelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFunnelNotice[]): Map<string, string[]> {
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

export function defaultBatchedFunnelNoticeValidator(): BatchedFunnelNoticeValidator {
  return new BatchedFunnelNoticeValidator(
    [
      new BatchedFunnelNoticeLabelLengthRule(120),
      new BatchedFunnelNoticeCodePrefixRule("Q"),
      new BatchedFunnelNoticeOpenRateRangeRule(4.6, 1437.5),
      new BatchedFunnelNoticeCodeLengthRule(3600),
      new BatchedFunnelNoticeRequiredCodeRule("batched funnel notice needs a value"),
      new BatchedFunnelNoticeAllowedTitleRule(["lenient"]),
    ],
  );
}
