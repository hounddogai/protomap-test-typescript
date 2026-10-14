import * as text from "../../../../kit/text.js";
import { WeightedPreferenceThreshold } from "./weighted-preference-threshold.js";

/** A rule a weighted preference threshold must pass. Check returns its problems, or none. */
export interface WeightedPreferenceThresholdRule {
  check(item: WeightedPreferenceThreshold): string[];
}

export class WeightedPreferenceThresholdRequiredCodeRule implements WeightedPreferenceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceThresholdAllowedLabelRule implements WeightedPreferenceThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPreferenceThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class WeightedPreferenceThresholdStartsAtRangeRule implements WeightedPreferenceThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPreferenceThreshold): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a weighted preference threshold. */
export class WeightedPreferenceThresholdValidator {
  rules: WeightedPreferenceThresholdRule[];

  constructor(rules: WeightedPreferenceThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPreferenceThreshold): string[] {
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

  requireValid(item: WeightedPreferenceThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPreferenceThreshold[]): Map<string, string[]> {
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

export function defaultWeightedPreferenceThresholdValidator(): WeightedPreferenceThresholdValidator {
  return new WeightedPreferenceThresholdValidator(
    [
      new WeightedPreferenceThresholdRequiredCodeRule("weighted preference threshold needs a value"),
      new WeightedPreferenceThresholdAllowedLabelRule([]),
      new WeightedPreferenceThresholdStartsAtRangeRule(255, 255),
    ],
  );
}
