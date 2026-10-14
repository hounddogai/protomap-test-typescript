import * as text from "../../../../kit/text.js";
import { WindowScore } from "./window-score.js";

/** A rule a window score must pass. Check returns its problems, or none. */
export interface WindowScoreRule {
  check(item: WindowScore): string[];
}

export class WindowScoreChannelLengthRule implements WindowScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowScore): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowScoreAllowedChannelRule implements WindowScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is missing`];
    return [];
  }
}

export class WindowScoreDiscountRangeRule implements WindowScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowScore): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowScoreLabelLengthRule implements WindowScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowScoreRequiredChannelRule implements WindowScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowScore): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class WindowScoreBudgetRangeRule implements WindowScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowScore): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a window score. */
export class WindowScoreValidator {
  rules: WindowScoreRule[];

  constructor(rules: WindowScoreRule[]) {
    this.rules = rules;
  }

  validate(item: WindowScore): string[] {
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

  requireValid(item: WindowScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowScore[]): Map<string, string[]> {
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

export function defaultWindowScoreValidator(): WindowScoreValidator {
  return new WindowScoreValidator(
    [
      new WindowScoreChannelLengthRule(120),
      new WindowScoreAllowedChannelRule(["capped", "lenient"]),
      new WindowScoreDiscountRangeRule(7.6, 3132.8),
      new WindowScoreLabelLengthRule(64),
      new WindowScoreRequiredChannelRule("window score needs a value"),
      new WindowScoreBudgetRangeRule(1.3, 3261.1),
    ],
  );
}
