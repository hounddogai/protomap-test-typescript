import * as text from "../../../../kit/text.js";
import { ScheduledBranchProfile } from "./scheduled-branch-profile.js";

/** A rule a scheduled branch profile must pass. Check returns its problems, or none. */
export interface ScheduledBranchProfileRule {
  check(item: ScheduledBranchProfile): string[];
}

export class ScheduledBranchProfileBidRangeRule implements ScheduledBranchProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledBranchProfile): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledBranchProfileRequiredJourneyIdRule implements ScheduledBranchProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBranchProfile): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBranchProfileAllowedCountryRule implements ScheduledBranchProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledBranchProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is missing`];
    return [];
  }
}

export class ScheduledBranchProfileJourneyIdLengthRule implements ScheduledBranchProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBranchProfile): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled branch profile. */
export class ScheduledBranchProfileValidator {
  rules: ScheduledBranchProfileRule[];

  constructor(rules: ScheduledBranchProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBranchProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledBranchProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBranchProfile[]): Map<string, string[]> {
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

export function defaultScheduledBranchProfileValidator(): ScheduledBranchProfileValidator {
  return new ScheduledBranchProfileValidator(
    [
      new ScheduledBranchProfileBidRangeRule(2.3, 1854.9),
      new ScheduledBranchProfileRequiredJourneyIdRule("scheduled branch profile needs this field"),
      new ScheduledBranchProfileAllowedCountryRule(["weighted", "primary", "scheduled"]),
      new ScheduledBranchProfileJourneyIdLengthRule(80),
    ],
  );
}
