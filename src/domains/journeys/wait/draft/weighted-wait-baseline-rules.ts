import * as text from "../../../../kit/text.js";
import { WeightedWaitBaseline } from "./weighted-wait-baseline.js";

/** A rule a weighted wait baseline must pass. Check returns its problems, or none. */
export interface WeightedWaitBaselineRule {
  check(item: WeightedWaitBaseline): string[];
}

export class WeightedWaitBaselineRequiredTitleRule implements WeightedWaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWaitBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWaitBaselineCodePrefixRule implements WeightedWaitBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedWaitBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedWaitBaselineAllowedUnitRule implements WeightedWaitBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedWaitBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is blocked`];
    return [];
  }
}

export class WeightedWaitBaselinePriorityRangeRule implements WeightedWaitBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWaitBaseline): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWaitBaselineRevisionRangeRule implements WeightedWaitBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWaitBaseline): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWaitBaselineTitleLengthRule implements WeightedWaitBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWaitBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted wait baseline. */
export class WeightedWaitBaselineValidator {
  rules: WeightedWaitBaselineRule[];

  constructor(rules: WeightedWaitBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWaitBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedWaitBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWaitBaseline[]): Map<string, string[]> {
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

export function defaultWeightedWaitBaselineValidator(): WeightedWaitBaselineValidator {
  return new WeightedWaitBaselineValidator(
    [
      new WeightedWaitBaselineRequiredTitleRule("weighted wait baseline needs an entry"),
      new WeightedWaitBaselineCodePrefixRule("Q"),
      new WeightedWaitBaselineAllowedUnitRule([]),
      new WeightedWaitBaselinePriorityRangeRule(16, 32),
      new WeightedWaitBaselineRevisionRangeRule(64, 86400),
      new WeightedWaitBaselineTitleLengthRule(86400),
    ],
  );
}
