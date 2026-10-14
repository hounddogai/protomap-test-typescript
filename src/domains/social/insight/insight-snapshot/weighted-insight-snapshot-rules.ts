import * as text from "../../../../kit/text.js";
import { WeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

/** A rule a weighted insight snapshot must pass. Check returns its problems, or none. */
export interface WeightedInsightSnapshotRule {
  check(item: WeightedInsightSnapshot): string[];
}

export class WeightedInsightSnapshotNameLengthRule implements WeightedInsightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightSnapshotLabelLengthRule implements WeightedInsightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightSnapshotAttemptsRangeRule implements WeightedInsightSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInsightSnapshot): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedInsightSnapshotRevisionRangeRule implements WeightedInsightSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInsightSnapshot): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedInsightSnapshotAllowedLabelRule implements WeightedInsightSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedInsightSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class WeightedInsightSnapshotRequiredCodeRule implements WeightedInsightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted insight snapshot. */
export class WeightedInsightSnapshotValidator {
  rules: WeightedInsightSnapshotRule[];

  constructor(rules: WeightedInsightSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInsightSnapshot): string[] {
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

  requireValid(item: WeightedInsightSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInsightSnapshot[]): Map<string, string[]> {
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

export function defaultWeightedInsightSnapshotValidator(): WeightedInsightSnapshotValidator {
  return new WeightedInsightSnapshotValidator(
    [
      new WeightedInsightSnapshotNameLengthRule(120),
      new WeightedInsightSnapshotLabelLengthRule(255),
      new WeightedInsightSnapshotAttemptsRangeRule(1000, 1000),
      new WeightedInsightSnapshotRevisionRangeRule(255, 3600),
      new WeightedInsightSnapshotAllowedLabelRule(["fallback", "primary"]),
      new WeightedInsightSnapshotRequiredCodeRule("weighted insight snapshot needs an entry"),
    ],
  );
}
