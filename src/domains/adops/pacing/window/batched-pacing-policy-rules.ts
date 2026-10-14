import { BatchedPacingPolicy } from "./batched-pacing-policy.js";

/** A rule a batched pacing policy must pass. Check returns its problems, or none. */
export interface BatchedPacingPolicyRule {
  check(item: BatchedPacingPolicy): string[];
}

export class BatchedPacingPolicyGraceDaysRangeRule implements BatchedPacingPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingPolicy): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPacingPolicyUnitLengthRule implements BatchedPacingPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPacingPolicy): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPacingPolicyRequiredCodeRule implements BatchedPacingPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPacingPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched pacing policy. */
export class BatchedPacingPolicyValidator {
  rules: BatchedPacingPolicyRule[];

  constructor(rules: BatchedPacingPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPacingPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPacingPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPacingPolicy[]): Map<string, string[]> {
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

export function defaultBatchedPacingPolicyValidator(): BatchedPacingPolicyValidator {
  return new BatchedPacingPolicyValidator(
    [
      new BatchedPacingPolicyGraceDaysRangeRule(255, 86400),
      new BatchedPacingPolicyUnitLengthRule(3600),
      new BatchedPacingPolicyRequiredCodeRule("batched pacing policy needs an entry"),
    ],
  );
}
