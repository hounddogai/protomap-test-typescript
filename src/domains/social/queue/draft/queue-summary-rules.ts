import * as text from "../../../../kit/text.js";
import { QueueSummary } from "./queue-summary.js";

/** A rule a queue summary must pass. Check returns its problems, or none. */
export interface QueueSummaryRule {
  check(item: QueueSummary): string[];
}

export class QueueSummaryRequiredCodeRule implements QueueSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueSummaryRequiredReviewerRule implements QueueSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueSummary): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class QueueSummaryRequiredLabelRule implements QueueSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class QueueSummaryAllowedSummaryRule implements QueueSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is blocked`];
    return [];
  }
}

export class QueueSummaryClicksRangeRule implements QueueSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueSummary): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a queue summary. */
export class QueueSummaryValidator {
  rules: QueueSummaryRule[];

  constructor(rules: QueueSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: QueueSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueSummary[]): Map<string, string[]> {
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

export function defaultQueueSummaryValidator(): QueueSummaryValidator {
  return new QueueSummaryValidator(
    [
      new QueueSummaryRequiredCodeRule("queue summary needs this field"),
      new QueueSummaryRequiredReviewerRule("queue summary needs this field"),
      new QueueSummaryRequiredLabelRule("queue summary needs an entry"),
      new QueueSummaryAllowedSummaryRule(["tiered", "capped", "primary"]),
      new QueueSummaryClicksRangeRule(32, 80),
    ],
  );
}
