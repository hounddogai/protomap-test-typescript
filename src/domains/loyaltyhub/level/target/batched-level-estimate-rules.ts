import { BatchedLevelEstimate } from "./batched-level-estimate.js";

/** A rule a batched level estimate must pass. Check returns its problems, or none. */
export interface BatchedLevelEstimateRule {
  check(item: BatchedLevelEstimate): string[];
}

export class BatchedLevelEstimateCodeLengthRule implements BatchedLevelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLevelEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedLevelEstimateTimezoneLengthRule implements BatchedLevelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLevelEstimate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedLevelEstimateRequiredNameRule implements BatchedLevelEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLevelEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched level estimate. */
export class BatchedLevelEstimateValidator {
  rules: BatchedLevelEstimateRule[];

  constructor(rules: BatchedLevelEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedLevelEstimate): string[] {
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

  requireValid(item: BatchedLevelEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedLevelEstimate[]): Map<string, string[]> {
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

export function defaultBatchedLevelEstimateValidator(): BatchedLevelEstimateValidator {
  return new BatchedLevelEstimateValidator(
    [
      new BatchedLevelEstimateCodeLengthRule(80),
      new BatchedLevelEstimateTimezoneLengthRule(80),
      new BatchedLevelEstimateRequiredNameRule("batched level estimate needs this field"),
    ],
  );
}
