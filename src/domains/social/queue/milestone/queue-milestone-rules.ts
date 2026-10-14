import * as text from "../../../../kit/text.js";
import { QueueMilestone } from "./queue-milestone.js";

/** A rule a queue milestone must pass. Check returns its problems, or none. */
export interface QueueMilestoneRule {
  check(item: QueueMilestone): string[];
}

export class QueueMilestoneOwnerIdLengthRule implements QueueMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueMilestone): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueMilestoneAllowedNotesRule implements QueueMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is missing`];
    return [];
  }
}

export class QueueMilestoneNameLengthRule implements QueueMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue milestone. */
export class QueueMilestoneValidator {
  rules: QueueMilestoneRule[];

  constructor(rules: QueueMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: QueueMilestone): string[] {
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

  requireValid(item: QueueMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueMilestone[]): Map<string, string[]> {
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

export function defaultQueueMilestoneValidator(): QueueMilestoneValidator {
  return new QueueMilestoneValidator(
    [
      new QueueMilestoneOwnerIdLengthRule(86400),
      new QueueMilestoneAllowedNotesRule(["lenient", "adaptive"]),
      new QueueMilestoneNameLengthRule(80),
    ],
  );
}
