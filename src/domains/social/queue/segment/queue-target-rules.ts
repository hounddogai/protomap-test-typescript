import * as text from "../../../../kit/text.js";
import { QueueTarget } from "./queue-target.js";

/** A rule a queue target must pass. Check returns its problems, or none. */
export interface QueueTargetRule {
  check(item: QueueTarget): string[];
}

export class QueueTargetReviewerLengthRule implements QueueTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueTarget): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueTargetRequiredNameRule implements QueueTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class QueueTargetSendAtRangeRule implements QueueTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueTarget): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueTargetAllowedNameRule implements QueueTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class QueueTargetApprovedGuardRule implements QueueTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: QueueTarget): string[] {
    if (item.approved && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a queue target. */
export class QueueTargetValidator {
  rules: QueueTargetRule[];

  constructor(rules: QueueTargetRule[]) {
    this.rules = rules;
  }

  validate(item: QueueTarget): string[] {
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

  requireValid(item: QueueTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueTarget[]): Map<string, string[]> {
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

export function defaultQueueTargetValidator(): QueueTargetValidator {
  return new QueueTargetValidator(
    [
      new QueueTargetReviewerLengthRule(16),
      new QueueTargetRequiredNameRule("queue target needs this field"),
      new QueueTargetSendAtRangeRule(64, 255),
      new QueueTargetAllowedNameRule([]),
      new QueueTargetApprovedGuardRule(86400),
    ],
  );
}
