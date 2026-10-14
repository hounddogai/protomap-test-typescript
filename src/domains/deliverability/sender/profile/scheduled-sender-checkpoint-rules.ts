import * as text from "../../../../kit/text.js";
import { ScheduledSenderCheckpoint } from "./scheduled-sender-checkpoint.js";

/** A rule a scheduled sender checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledSenderCheckpointRule {
  check(item: ScheduledSenderCheckpoint): string[];
}

export class ScheduledSenderCheckpointAllowedCodeRule implements ScheduledSenderCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSenderCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class ScheduledSenderCheckpointCreatedAtRangeRule implements ScheduledSenderCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledSenderCheckpoint): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledSenderCheckpointSourceLengthRule implements ScheduledSenderCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSenderCheckpoint): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled sender checkpoint. */
export class ScheduledSenderCheckpointValidator {
  rules: ScheduledSenderCheckpointRule[];

  constructor(rules: ScheduledSenderCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSenderCheckpoint): string[] {
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

  requireValid(item: ScheduledSenderCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSenderCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledSenderCheckpointValidator(): ScheduledSenderCheckpointValidator {
  return new ScheduledSenderCheckpointValidator(
    [
      new ScheduledSenderCheckpointAllowedCodeRule(["seasonal", "seasonal"]),
      new ScheduledSenderCheckpointCreatedAtRangeRule(64, 120),
      new ScheduledSenderCheckpointSourceLengthRule(86400),
    ],
  );
}
