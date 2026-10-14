import * as text from "../../../../kit/text.js";
import { BatchedChallengeBaseline } from "./batched-challenge-baseline.js";

/** A rule a batched challenge baseline must pass. Check returns its problems, or none. */
export interface BatchedChallengeBaselineRule {
  check(item: BatchedChallengeBaseline): string[];
}

export class BatchedChallengeBaselineRequiredLabelRule implements BatchedChallengeBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedChallengeBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedChallengeBaselineCodePrefixRule implements BatchedChallengeBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedChallengeBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedChallengeBaselineAllowedLabelRule implements BatchedChallengeBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedChallengeBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

/** Runs every rule of a batched challenge baseline. */
export class BatchedChallengeBaselineValidator {
  rules: BatchedChallengeBaselineRule[];

  constructor(rules: BatchedChallengeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedChallengeBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedChallengeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedChallengeBaseline[]): Map<string, string[]> {
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

export function defaultBatchedChallengeBaselineValidator(): BatchedChallengeBaselineValidator {
  return new BatchedChallengeBaselineValidator(
    [
      new BatchedChallengeBaselineRequiredLabelRule("batched challenge baseline needs a value"),
      new BatchedChallengeBaselineCodePrefixRule("OPS"),
      new BatchedChallengeBaselineAllowedLabelRule(["seasonal", "lenient"]),
    ],
  );
}
