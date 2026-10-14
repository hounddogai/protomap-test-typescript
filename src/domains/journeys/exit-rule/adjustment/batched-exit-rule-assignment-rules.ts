import * as text from "../../../../kit/text.js";
import { BatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

/** A rule a batched exit rule assignment must pass. Check returns its problems, or none. */
export interface BatchedExitRuleAssignmentRule {
  check(item: BatchedExitRuleAssignment): string[];
}

export class BatchedExitRuleAssignmentChannelLengthRule implements BatchedExitRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleAssignment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedExitRuleAssignmentTitleLengthRule implements BatchedExitRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedExitRuleAssignmentAllowedJourneyIdRule implements BatchedExitRuleAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedExitRuleAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is above maximum`];
    return [];
  }
}

/** Runs every rule of a batched exit rule assignment. */
export class BatchedExitRuleAssignmentValidator {
  rules: BatchedExitRuleAssignmentRule[];

  constructor(rules: BatchedExitRuleAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedExitRuleAssignment): string[] {
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

  requireValid(item: BatchedExitRuleAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedExitRuleAssignment[]): Map<string, string[]> {
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

export function defaultBatchedExitRuleAssignmentValidator(): BatchedExitRuleAssignmentValidator {
  return new BatchedExitRuleAssignmentValidator(
    [
      new BatchedExitRuleAssignmentChannelLengthRule(120),
      new BatchedExitRuleAssignmentTitleLengthRule(32),
      new BatchedExitRuleAssignmentAllowedJourneyIdRule(["scheduled"]),
    ],
  );
}
