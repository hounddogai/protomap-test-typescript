import { BatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

/** A rule a batched bid rule notice must pass. Check returns its problems, or none. */
export interface BatchedBidRuleNoticeRule {
  check(item: BatchedBidRuleNotice): string[];
}

export class BatchedBidRuleNoticeRequiredTitleRule implements BatchedBidRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBidRuleNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedBidRuleNoticeRequiredCodeRule implements BatchedBidRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBidRuleNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedBidRuleNoticePriorityRangeRule implements BatchedBidRuleNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedBidRuleNotice): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedBidRuleNoticeRequiredTimezoneRule implements BatchedBidRuleNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBidRuleNotice): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched bid rule notice. */
export class BatchedBidRuleNoticeValidator {
  rules: BatchedBidRuleNoticeRule[];

  constructor(rules: BatchedBidRuleNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBidRuleNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedBidRuleNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBidRuleNotice[]): Map<string, string[]> {
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

export function defaultBatchedBidRuleNoticeValidator(): BatchedBidRuleNoticeValidator {
  return new BatchedBidRuleNoticeValidator(
    [
      new BatchedBidRuleNoticeRequiredTitleRule("batched bid rule notice needs a value"),
      new BatchedBidRuleNoticeRequiredCodeRule("batched bid rule notice needs this field"),
      new BatchedBidRuleNoticePriorityRangeRule(32, 255),
      new BatchedBidRuleNoticeRequiredTimezoneRule("batched bid rule notice needs a value"),
    ],
  );
}
