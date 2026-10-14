import * as text from "../../../../kit/text.js";
import { ScheduledTouchpointBaseline } from "./scheduled-touchpoint-baseline.js";

/** A rule a scheduled touchpoint baseline must pass. Check returns its problems, or none. */
export interface ScheduledTouchpointBaselineRule {
  check(item: ScheduledTouchpointBaseline): string[];
}

export class ScheduledTouchpointBaselineRegionLengthRule implements ScheduledTouchpointBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledTouchpointBaseline): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledTouchpointBaselineRequiredContactEmailRule implements ScheduledTouchpointBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledTouchpointBaseline): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledTouchpointBaselineAllowedReviewerRule implements ScheduledTouchpointBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledTouchpointBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is above maximum`];
    return [];
  }
}

export class ScheduledTouchpointBaselineAttemptsRangeRule implements ScheduledTouchpointBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledTouchpointBaseline): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled touchpoint baseline. */
export class ScheduledTouchpointBaselineValidator {
  rules: ScheduledTouchpointBaselineRule[];

  constructor(rules: ScheduledTouchpointBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledTouchpointBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledTouchpointBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledTouchpointBaseline[]): Map<string, string[]> {
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

export function defaultScheduledTouchpointBaselineValidator(): ScheduledTouchpointBaselineValidator {
  return new ScheduledTouchpointBaselineValidator(
    [
      new ScheduledTouchpointBaselineRegionLengthRule(32),
      new ScheduledTouchpointBaselineRequiredContactEmailRule("scheduled touchpoint baseline needs this field"),
      new ScheduledTouchpointBaselineAllowedReviewerRule(["legacy", "scheduled"]),
      new ScheduledTouchpointBaselineAttemptsRangeRule(80, 1000),
    ],
  );
}
