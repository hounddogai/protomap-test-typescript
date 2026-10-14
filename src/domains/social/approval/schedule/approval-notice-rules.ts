import * as text from "../../../../kit/text.js";
import { ApprovalNotice } from "./approval-notice.js";

/** A rule a approval notice must pass. Check returns its problems, or none. */
export interface ApprovalNoticeRule {
  check(item: ApprovalNotice): string[];
}

export class ApprovalNoticeAllowedLabelRule implements ApprovalNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class ApprovalNoticeThresholdRangeRule implements ApprovalNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalNotice): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalNoticeSourceLengthRule implements ApprovalNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalNotice): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalNoticeLabelLengthRule implements ApprovalNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalNoticeRequiredSourceRule implements ApprovalNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalNotice): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval notice. */
export class ApprovalNoticeValidator {
  rules: ApprovalNoticeRule[];

  constructor(rules: ApprovalNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalNotice[]): Map<string, string[]> {
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

export function defaultApprovalNoticeValidator(): ApprovalNoticeValidator {
  return new ApprovalNoticeValidator(
    [
      new ApprovalNoticeAllowedLabelRule(["strict", "weighted"]),
      new ApprovalNoticeThresholdRangeRule(0.3, 2702.6),
      new ApprovalNoticeSourceLengthRule(32),
      new ApprovalNoticeLabelLengthRule(16),
      new ApprovalNoticeRequiredSourceRule("approval notice needs this field"),
    ],
  );
}
