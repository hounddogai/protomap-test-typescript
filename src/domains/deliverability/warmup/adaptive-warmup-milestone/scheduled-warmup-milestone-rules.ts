import * as text from "../../../../kit/text.js";
import { ScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

/** A rule a scheduled warmup milestone must pass. Check returns its problems, or none. */
export interface ScheduledWarmupMilestoneRule {
  check(item: ScheduledWarmupMilestone): string[];
}

export class ScheduledWarmupMilestoneCodeLengthRule implements ScheduledWarmupMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWarmupMilestoneDurationMinutesRangeRule implements ScheduledWarmupMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupMilestone): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledWarmupMilestoneAllowedLabelRule implements ScheduledWarmupMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledWarmupMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class ScheduledWarmupMilestoneRequiredTimezoneRule implements ScheduledWarmupMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWarmupMilestone): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled warmup milestone. */
export class ScheduledWarmupMilestoneValidator {
  rules: ScheduledWarmupMilestoneRule[];

  constructor(rules: ScheduledWarmupMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWarmupMilestone): string[] {
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

  requireValid(item: ScheduledWarmupMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWarmupMilestone[]): Map<string, string[]> {
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

export function defaultScheduledWarmupMilestoneValidator(): ScheduledWarmupMilestoneValidator {
  return new ScheduledWarmupMilestoneValidator(
    [
      new ScheduledWarmupMilestoneCodeLengthRule(1000),
      new ScheduledWarmupMilestoneDurationMinutesRangeRule(80, 1000),
      new ScheduledWarmupMilestoneAllowedLabelRule([]),
      new ScheduledWarmupMilestoneRequiredTimezoneRule("scheduled warmup milestone needs an entry"),
    ],
  );
}
