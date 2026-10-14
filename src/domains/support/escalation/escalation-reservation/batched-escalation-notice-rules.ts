import * as text from "../../../../kit/text.js";
import { BatchedEscalationNotice } from "./batched-escalation-notice.js";

/** A rule a batched escalation notice must pass. Check returns its problems, or none. */
export interface BatchedEscalationNoticeRule {
  check(item: BatchedEscalationNotice): string[];
}

export class BatchedEscalationNoticeNameLengthRule implements BatchedEscalationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedEscalationNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedEscalationNoticeAllowedCountryRule implements BatchedEscalationNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedEscalationNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is stale`];
    return [];
  }
}

export class BatchedEscalationNoticeDurationMinutesRangeRule implements BatchedEscalationNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedEscalationNotice): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedEscalationNoticeLabelLengthRule implements BatchedEscalationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedEscalationNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched escalation notice. */
export class BatchedEscalationNoticeValidator {
  rules: BatchedEscalationNoticeRule[];

  constructor(rules: BatchedEscalationNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedEscalationNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedEscalationNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedEscalationNotice[]): Map<string, string[]> {
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

export function defaultBatchedEscalationNoticeValidator(): BatchedEscalationNoticeValidator {
  return new BatchedEscalationNoticeValidator(
    [
      new BatchedEscalationNoticeNameLengthRule(16),
      new BatchedEscalationNoticeAllowedCountryRule(["global"]),
      new BatchedEscalationNoticeDurationMinutesRangeRule(32, 80),
      new BatchedEscalationNoticeLabelLengthRule(86400),
    ],
  );
}
