import * as text from "../../../../kit/text.js";
import { BatchedReputationBundle } from "./batched-reputation-bundle.js";

/** A rule a batched reputation bundle must pass. Check returns its problems, or none. */
export interface BatchedReputationBundleRule {
  check(item: BatchedReputationBundle): string[];
}

export class BatchedReputationBundleRegionLengthRule implements BatchedReputationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedReputationBundle): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedReputationBundleAllowedLocaleRule implements BatchedReputationBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedReputationBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is not allowed`];
    return [];
  }
}

export class BatchedReputationBundleRequiredRegionRule implements BatchedReputationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReputationBundle): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched reputation bundle. */
export class BatchedReputationBundleValidator {
  rules: BatchedReputationBundleRule[];

  constructor(rules: BatchedReputationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedReputationBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedReputationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedReputationBundle[]): Map<string, string[]> {
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

export function defaultBatchedReputationBundleValidator(): BatchedReputationBundleValidator {
  return new BatchedReputationBundleValidator(
    [
      new BatchedReputationBundleRegionLengthRule(120),
      new BatchedReputationBundleAllowedLocaleRule([]),
      new BatchedReputationBundleRequiredRegionRule("batched reputation bundle needs a value"),
    ],
  );
}
