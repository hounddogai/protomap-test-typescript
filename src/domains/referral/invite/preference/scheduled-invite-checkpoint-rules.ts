import * as text from "../../../../kit/text.js";
import { ScheduledInviteCheckpoint } from "./scheduled-invite-checkpoint.js";

/** A rule a scheduled invite checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledInviteCheckpointRule {
  check(item: ScheduledInviteCheckpoint): string[];
}

export class ScheduledInviteCheckpointScoreRangeRule implements ScheduledInviteCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledInviteCheckpoint): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledInviteCheckpointTitleLengthRule implements ScheduledInviteCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInviteCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledInviteCheckpointAllowedCodeRule implements ScheduledInviteCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledInviteCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class ScheduledInviteCheckpointCodeLengthRule implements ScheduledInviteCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledInviteCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled invite checkpoint. */
export class ScheduledInviteCheckpointValidator {
  rules: ScheduledInviteCheckpointRule[];

  constructor(rules: ScheduledInviteCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledInviteCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledInviteCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledInviteCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledInviteCheckpointValidator(): ScheduledInviteCheckpointValidator {
  return new ScheduledInviteCheckpointValidator(
    [
      new ScheduledInviteCheckpointScoreRangeRule(9.1, 4854.4),
      new ScheduledInviteCheckpointTitleLengthRule(80),
      new ScheduledInviteCheckpointAllowedCodeRule([]),
      new ScheduledInviteCheckpointCodeLengthRule(3600),
    ],
  );
}
