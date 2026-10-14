import * as text from "../../../../kit/text.js";
import { ManualNudgeException } from "./manual-nudge-exception.js";

/** A rule a manual nudge exception must pass. Check returns its problems, or none. */
export interface ManualNudgeExceptionRule {
  check(item: ManualNudgeException): string[];
}

export class ManualNudgeExceptionFrequencyCapRangeRule implements ManualNudgeExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualNudgeException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualNudgeExceptionOwnerIdLengthRule implements ManualNudgeExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualNudgeException): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualNudgeExceptionAllowedNameRule implements ManualNudgeExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualNudgeException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

/** Runs every rule of a manual nudge exception. */
export class ManualNudgeExceptionValidator {
  rules: ManualNudgeExceptionRule[];

  constructor(rules: ManualNudgeExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ManualNudgeException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualNudgeException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualNudgeException[]): Map<string, string[]> {
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

export function defaultManualNudgeExceptionValidator(): ManualNudgeExceptionValidator {
  return new ManualNudgeExceptionValidator(
    [
      new ManualNudgeExceptionFrequencyCapRangeRule(64, 86400),
      new ManualNudgeExceptionOwnerIdLengthRule(1000),
      new ManualNudgeExceptionAllowedNameRule(["rolling", "primary", "tiered"]),
    ],
  );
}
