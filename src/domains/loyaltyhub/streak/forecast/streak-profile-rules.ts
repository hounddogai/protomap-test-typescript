import * as text from "../../../../kit/text.js";
import { StreakProfile } from "./streak-profile.js";

/** A rule a streak profile must pass. Check returns its problems, or none. */
export interface StreakProfileRule {
  check(item: StreakProfile): string[];
}

export class StreakProfileWeightRangeRule implements StreakProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakProfile): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakProfileChannelLengthRule implements StreakProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakProfile): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakProfileAllowedLabelRule implements StreakProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class StreakProfileRequiredCodeRule implements StreakProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak profile. */
export class StreakProfileValidator {
  rules: StreakProfileRule[];

  constructor(rules: StreakProfileRule[]) {
    this.rules = rules;
  }

  validate(item: StreakProfile): string[] {
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

  requireValid(item: StreakProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakProfile[]): Map<string, string[]> {
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

export function defaultStreakProfileValidator(): StreakProfileValidator {
  return new StreakProfileValidator(
    [
      new StreakProfileWeightRangeRule(10, 2445.7),
      new StreakProfileChannelLengthRule(255),
      new StreakProfileAllowedLabelRule([]),
      new StreakProfileRequiredCodeRule("streak profile needs a value"),
    ],
  );
}
