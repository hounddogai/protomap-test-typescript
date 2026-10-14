import { BatchedProofProfile } from "./batched-proof-profile.js";

/** A rule a batched proof profile must pass. Check returns its problems, or none. */
export interface BatchedProofProfileRule {
  check(item: BatchedProofProfile): string[];
}

export class BatchedProofProfileCodeLengthRule implements BatchedProofProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedProofProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedProofProfileAttemptsRangeRule implements BatchedProofProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedProofProfile): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedProofProfileRequiredCountryRule implements BatchedProofProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedProofProfile): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedProofProfileMinimumRangeRule implements BatchedProofProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedProofProfile): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched proof profile. */
export class BatchedProofProfileValidator {
  rules: BatchedProofProfileRule[];

  constructor(rules: BatchedProofProfileRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedProofProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedProofProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedProofProfile[]): Map<string, string[]> {
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

export function defaultBatchedProofProfileValidator(): BatchedProofProfileValidator {
  return new BatchedProofProfileValidator(
    [
      new BatchedProofProfileCodeLengthRule(86400),
      new BatchedProofProfileAttemptsRangeRule(16, 255),
      new BatchedProofProfileRequiredCountryRule("batched proof profile needs this field"),
      new BatchedProofProfileMinimumRangeRule(2.2, 4083.3),
    ],
  );
}
