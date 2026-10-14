import * as text from "../../../../kit/text.js";
import { MacroMetric } from "./macro-metric.js";

/** A rule a macro metric must pass. Check returns its problems, or none. */
export interface MacroMetricRule {
  check(item: MacroMetric): string[];
}

export class MacroMetricAllowedReviewerRule implements MacroMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is out of range`];
    return [];
  }
}

export class MacroMetricNameLengthRule implements MacroMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroMetric): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroMetricFrequencyCapRangeRule implements MacroMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroMetric): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a macro metric. */
export class MacroMetricValidator {
  rules: MacroMetricRule[];

  constructor(rules: MacroMetricRule[]) {
    this.rules = rules;
  }

  validate(item: MacroMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroMetric[]): Map<string, string[]> {
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

export function defaultMacroMetricValidator(): MacroMetricValidator {
  return new MacroMetricValidator(
    [
      new MacroMetricAllowedReviewerRule([]),
      new MacroMetricNameLengthRule(16),
      new MacroMetricFrequencyCapRangeRule(3600, 3600),
    ],
  );
}
