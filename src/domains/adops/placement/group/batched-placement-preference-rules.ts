import * as text from "../../../../kit/text.js";
import { BatchedPlacementPreference } from "./batched-placement-preference.js";

/** A rule a batched placement preference must pass. Check returns its problems, or none. */
export interface BatchedPlacementPreferenceRule {
  check(item: BatchedPlacementPreference): string[];
}

export class BatchedPlacementPreferenceCodeLengthRule implements BatchedPlacementPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementPreferenceCodePrefixRule implements BatchedPlacementPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPlacementPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPlacementPreferenceAllowedContactEmailRule implements BatchedPlacementPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPlacementPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is out of range`];
    return [];
  }
}

export class BatchedPlacementPreferenceRateRangeRule implements BatchedPlacementPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementPreference): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched placement preference. */
export class BatchedPlacementPreferenceValidator {
  rules: BatchedPlacementPreferenceRule[];

  constructor(rules: BatchedPlacementPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPlacementPreference): string[] {
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

  requireValid(item: BatchedPlacementPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPlacementPreference[]): Map<string, string[]> {
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

export function defaultBatchedPlacementPreferenceValidator(): BatchedPlacementPreferenceValidator {
  return new BatchedPlacementPreferenceValidator(
    [
      new BatchedPlacementPreferenceCodeLengthRule(86400),
      new BatchedPlacementPreferenceCodePrefixRule("ACM"),
      new BatchedPlacementPreferenceAllowedContactEmailRule(["lenient", "default", "lenient"]),
      new BatchedPlacementPreferenceRateRangeRule(3.6, 4217),
    ],
  );
}
