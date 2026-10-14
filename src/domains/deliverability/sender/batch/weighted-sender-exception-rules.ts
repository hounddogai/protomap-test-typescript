import * as text from "../../../../kit/text.js";
import { WeightedSenderException } from "./weighted-sender-exception.js";

/** A rule a weighted sender exception must pass. Check returns its problems, or none. */
export interface WeightedSenderExceptionRule {
  check(item: WeightedSenderException): string[];
}

export class WeightedSenderExceptionMarginRangeRule implements WeightedSenderExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSenderException): string[] {
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

export class WeightedSenderExceptionAllowedChannelRule implements WeightedSenderExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedSenderException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

export class WeightedSenderExceptionFrequencyCapRangeRule implements WeightedSenderExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedSenderException): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedSenderExceptionSummaryLengthRule implements WeightedSenderExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedSenderException): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedSenderExceptionRequiredSummaryRule implements WeightedSenderExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedSenderException): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted sender exception. */
export class WeightedSenderExceptionValidator {
  rules: WeightedSenderExceptionRule[];

  constructor(rules: WeightedSenderExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedSenderException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedSenderException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedSenderException[]): Map<string, string[]> {
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

export function defaultWeightedSenderExceptionValidator(): WeightedSenderExceptionValidator {
  return new WeightedSenderExceptionValidator(
    [
      new WeightedSenderExceptionMarginRangeRule(8.4, 3570.7),
      new WeightedSenderExceptionAllowedChannelRule([]),
      new WeightedSenderExceptionFrequencyCapRangeRule(80, 1000),
      new WeightedSenderExceptionSummaryLengthRule(3600),
      new WeightedSenderExceptionRequiredSummaryRule("weighted sender exception needs an entry"),
    ],
  );
}
