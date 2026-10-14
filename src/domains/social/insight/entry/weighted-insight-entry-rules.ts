import * as text from "../../../../kit/text.js";
import { WeightedInsightEntry } from "./weighted-insight-entry.js";

/** A rule a weighted insight entry must pass. Check returns its problems, or none. */
export interface WeightedInsightEntryRule {
  check(item: WeightedInsightEntry): string[];
}

export class WeightedInsightEntryVisibleGuardRule implements WeightedInsightEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedInsightEntry): string[] {
    if (item.visible && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class WeightedInsightEntryThresholdRangeRule implements WeightedInsightEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInsightEntry): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedInsightEntryAllowedLabelRule implements WeightedInsightEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedInsightEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class WeightedInsightEntryRequiredCodeRule implements WeightedInsightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInsightEntryReviewerLengthRule implements WeightedInsightEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightEntry): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightEntryRequiredReviewerRule implements WeightedInsightEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightEntry): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted insight entry. */
export class WeightedInsightEntryValidator {
  rules: WeightedInsightEntryRule[];

  constructor(rules: WeightedInsightEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInsightEntry): string[] {
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

  requireValid(item: WeightedInsightEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInsightEntry[]): Map<string, string[]> {
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

export function defaultWeightedInsightEntryValidator(): WeightedInsightEntryValidator {
  return new WeightedInsightEntryValidator(
    [
      new WeightedInsightEntryVisibleGuardRule(8.9),
      new WeightedInsightEntryThresholdRangeRule(1.1, 1474.1),
      new WeightedInsightEntryAllowedLabelRule(["capped"]),
      new WeightedInsightEntryRequiredCodeRule("weighted insight entry needs an entry"),
      new WeightedInsightEntryReviewerLengthRule(80),
      new WeightedInsightEntryRequiredReviewerRule("weighted insight entry needs this field"),
    ],
  );
}
