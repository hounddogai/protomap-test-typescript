import * as text from "../../../../kit/text.js";
import { PendingBadgeException } from "./pending-badge-exception.js";

/** A rule a pending badge exception must pass. Check returns its problems, or none. */
export interface PendingBadgeExceptionRule {
  check(item: PendingBadgeException): string[];
}

export class PendingBadgeExceptionLabelLengthRule implements PendingBadgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBadgeException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBadgeExceptionRequiredCodeRule implements PendingBadgeExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBadgeException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBadgeExceptionAllowedCodeRule implements PendingBadgeExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBadgeException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class PendingBadgeExceptionMarginRangeRule implements PendingBadgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBadgeException): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingBadgeExceptionWindowDaysRangeRule implements PendingBadgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBadgeException): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBadgeExceptionPinnedGuardRule implements PendingBadgeExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingBadgeException): string[] {
    if (item.pinned && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a pending badge exception. */
export class PendingBadgeExceptionValidator {
  rules: PendingBadgeExceptionRule[];

  constructor(rules: PendingBadgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBadgeException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBadgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBadgeException[]): Map<string, string[]> {
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

export function defaultPendingBadgeExceptionValidator(): PendingBadgeExceptionValidator {
  return new PendingBadgeExceptionValidator(
    [
      new PendingBadgeExceptionLabelLengthRule(32),
      new PendingBadgeExceptionRequiredCodeRule("pending badge exception needs an entry"),
      new PendingBadgeExceptionAllowedCodeRule(["capped", "global"]),
      new PendingBadgeExceptionMarginRangeRule(9, 870.7),
      new PendingBadgeExceptionWindowDaysRangeRule(64, 255),
      new PendingBadgeExceptionPinnedGuardRule(5.6),
    ],
  );
}
