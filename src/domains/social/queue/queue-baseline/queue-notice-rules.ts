import { QueueNotice } from "./queue-notice.js";

/** A rule a queue notice must pass. Check returns its problems, or none. */
export interface QueueNoticeRule {
  check(item: QueueNotice): string[];
}

export class QueueNoticeVisibleGuardRule implements QueueNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: QueueNotice): string[] {
    if (item.visible && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class QueueNoticeBatchSizeRangeRule implements QueueNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueNotice): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueNoticeRequiredCodeRule implements QueueNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue notice. */
export class QueueNoticeValidator {
  rules: QueueNoticeRule[];

  constructor(rules: QueueNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: QueueNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueNotice[]): Map<string, string[]> {
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

export function defaultQueueNoticeValidator(): QueueNoticeValidator {
  return new QueueNoticeValidator(
    [
      new QueueNoticeVisibleGuardRule(3.5),
      new QueueNoticeBatchSizeRangeRule(64, 80),
      new QueueNoticeRequiredCodeRule("queue notice needs a value"),
    ],
  );
}
