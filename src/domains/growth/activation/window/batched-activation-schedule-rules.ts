import { BatchedActivationSchedule } from "./batched-activation-schedule.js";

/** A rule a batched activation schedule must pass. Check returns its problems, or none. */
export interface BatchedActivationScheduleRule {
  check(item: BatchedActivationSchedule): string[];
}

export class BatchedActivationScheduleRegionLengthRule implements BatchedActivationScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedActivationSchedule): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedActivationScheduleRequiredRegionRule implements BatchedActivationScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedActivationSchedule): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedActivationScheduleClicksRangeRule implements BatchedActivationScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedActivationSchedule): string[] {
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

/** Runs every rule of a batched activation schedule. */
export class BatchedActivationScheduleValidator {
  rules: BatchedActivationScheduleRule[];

  constructor(rules: BatchedActivationScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedActivationSchedule): string[] {
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

  requireValid(item: BatchedActivationSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedActivationSchedule[]): Map<string, string[]> {
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

export function defaultBatchedActivationScheduleValidator(): BatchedActivationScheduleValidator {
  return new BatchedActivationScheduleValidator(
    [
      new BatchedActivationScheduleRegionLengthRule(255),
      new BatchedActivationScheduleRequiredRegionRule("batched activation schedule needs a value"),
      new BatchedActivationScheduleClicksRangeRule(32, 1000),
    ],
  );
}
