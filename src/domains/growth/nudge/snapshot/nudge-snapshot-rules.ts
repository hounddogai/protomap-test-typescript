import * as text from "../../../../kit/text.js";
import { NudgeSnapshot } from "./nudge-snapshot.js";

/** A rule a nudge snapshot must pass. Check returns its problems, or none. */
export interface NudgeSnapshotRule {
  check(item: NudgeSnapshot): string[];
}

export class NudgeSnapshotCodeLengthRule implements NudgeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeSnapshotConversionRateRangeRule implements NudgeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeSnapshot): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeSnapshotAllowedCodeRule implements NudgeSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class NudgeSnapshotRequiredCodeRule implements NudgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeSnapshotRequiredTitleRule implements NudgeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge snapshot. */
export class NudgeSnapshotValidator {
  rules: NudgeSnapshotRule[];

  constructor(rules: NudgeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeSnapshot[]): Map<string, string[]> {
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

export function defaultNudgeSnapshotValidator(): NudgeSnapshotValidator {
  return new NudgeSnapshotValidator(
    [
      new NudgeSnapshotCodeLengthRule(32),
      new NudgeSnapshotConversionRateRangeRule(8.1, 3332),
      new NudgeSnapshotAllowedCodeRule(["weighted", "tiered"]),
      new NudgeSnapshotRequiredCodeRule("nudge snapshot needs a value"),
      new NudgeSnapshotRequiredTitleRule("nudge snapshot needs an entry"),
    ],
  );
}
