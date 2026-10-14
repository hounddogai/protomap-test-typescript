import * as text from "../../../../kit/text.js";
import { ScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

/** A rule a scheduled insight threshold must pass. Check returns its problems, or none. */
export interface ScheduledInsightThresholdRule {
  check(item: ScheduledInsightThreshold): string[];
}

export class ScheduledInsightThresholdMinimumRangeRule implements ScheduledInsightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledInsightThreshold): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledInsightThresholdDurationMinutesRangeRule implements ScheduledInsightThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledInsightThreshold): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledInsightThresholdAllowedNameRule implements ScheduledInsightThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledInsightThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

/** Runs every rule of a scheduled insight threshold. */
export class ScheduledInsightThresholdValidator {
  rules: ScheduledInsightThresholdRule[];

  constructor(rules: ScheduledInsightThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledInsightThreshold): string[] {
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

  requireValid(item: ScheduledInsightThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledInsightThreshold[]): Map<string, string[]> {
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

export function defaultScheduledInsightThresholdValidator(): ScheduledInsightThresholdValidator {
  return new ScheduledInsightThresholdValidator(
    [
      new ScheduledInsightThresholdMinimumRangeRule(3.3, 2529.3),
      new ScheduledInsightThresholdDurationMinutesRangeRule(32, 80),
      new ScheduledInsightThresholdAllowedNameRule([]),
    ],
  );
}
