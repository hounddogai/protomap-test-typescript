import * as text from "../../../../kit/text.js";
import { PreferenceException } from "./preference-exception.js";

/** A rule a preference exception must pass. Check returns its problems, or none. */
export interface PreferenceExceptionRule {
  check(item: PreferenceException): string[];
}

export class PreferenceExceptionAllowedSegmentRule implements PreferenceExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is blocked`];
    return [];
  }
}

export class PreferenceExceptionEndsAtRangeRule implements PreferenceExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceException): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceExceptionSegmentLengthRule implements PreferenceExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceException): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceExceptionMaximumRangeRule implements PreferenceExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceException): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceExceptionAmountRangeRule implements PreferenceExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceException): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceExceptionPinnedGuardRule implements PreferenceExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceException): string[] {
    if (item.pinned && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a preference exception. */
export class PreferenceExceptionValidator {
  rules: PreferenceExceptionRule[];

  constructor(rules: PreferenceExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceException): string[] {
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

  requireValid(item: PreferenceException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceException[]): Map<string, string[]> {
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

export function defaultPreferenceExceptionValidator(): PreferenceExceptionValidator {
  return new PreferenceExceptionValidator(
    [
      new PreferenceExceptionAllowedSegmentRule(["pending", "default", "lenient"]),
      new PreferenceExceptionEndsAtRangeRule(1000, 86400),
      new PreferenceExceptionSegmentLengthRule(1000),
      new PreferenceExceptionMaximumRangeRule(2.9, 1472.9),
      new PreferenceExceptionAmountRangeRule(9.5, 1774.7),
      new PreferenceExceptionPinnedGuardRule(16),
    ],
  );
}
