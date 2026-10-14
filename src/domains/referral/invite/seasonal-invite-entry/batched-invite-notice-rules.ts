import * as text from "../../../../kit/text.js";
import { BatchedInviteNotice } from "./batched-invite-notice.js";

/** A rule a batched invite notice must pass. Check returns its problems, or none. */
export interface BatchedInviteNoticeRule {
  check(item: BatchedInviteNotice): string[];
}

export class BatchedInviteNoticeAllowedSourceRule implements BatchedInviteNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedInviteNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is too long`];
    return [];
  }
}

export class BatchedInviteNoticeBatchSizeRangeRule implements BatchedInviteNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInviteNotice): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedInviteNoticeRequiredNameRule implements BatchedInviteNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInviteNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInviteNoticeQuantityRangeRule implements BatchedInviteNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInviteNotice): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched invite notice. */
export class BatchedInviteNoticeValidator {
  rules: BatchedInviteNoticeRule[];

  constructor(rules: BatchedInviteNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInviteNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedInviteNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInviteNotice[]): Map<string, string[]> {
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

export function defaultBatchedInviteNoticeValidator(): BatchedInviteNoticeValidator {
  return new BatchedInviteNoticeValidator(
    [
      new BatchedInviteNoticeAllowedSourceRule([]),
      new BatchedInviteNoticeBatchSizeRangeRule(120, 255),
      new BatchedInviteNoticeRequiredNameRule("batched invite notice needs an entry"),
      new BatchedInviteNoticeQuantityRangeRule(80, 80),
    ],
  );
}
