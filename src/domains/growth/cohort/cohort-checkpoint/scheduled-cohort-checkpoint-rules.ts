import * as text from "../../../../kit/text.js";
import { ScheduledCohortCheckpoint } from "./scheduled-cohort-checkpoint.js";

/** A rule a scheduled cohort checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledCohortCheckpointRule {
  check(item: ScheduledCohortCheckpoint): string[];
}

export class ScheduledCohortCheckpointExternalRefLengthRule implements ScheduledCohortCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortCheckpoint): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortCheckpointLabelLengthRule implements ScheduledCohortCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCohortCheckpointAllowedExternalRefRule implements ScheduledCohortCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledCohortCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is expired`];
    return [];
  }
}

export class ScheduledCohortCheckpointOpenRateRangeRule implements ScheduledCohortCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCohortCheckpoint): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCohortCheckpointChannelLengthRule implements ScheduledCohortCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCohortCheckpoint): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled cohort checkpoint. */
export class ScheduledCohortCheckpointValidator {
  rules: ScheduledCohortCheckpointRule[];

  constructor(rules: ScheduledCohortCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCohortCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCohortCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCohortCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledCohortCheckpointValidator(): ScheduledCohortCheckpointValidator {
  return new ScheduledCohortCheckpointValidator(
    [
      new ScheduledCohortCheckpointExternalRefLengthRule(64),
      new ScheduledCohortCheckpointLabelLengthRule(120),
      new ScheduledCohortCheckpointAllowedExternalRefRule(["fallback"]),
      new ScheduledCohortCheckpointOpenRateRangeRule(5.6, 1589.7),
      new ScheduledCohortCheckpointChannelLengthRule(3600),
    ],
  );
}
