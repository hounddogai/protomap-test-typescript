import { BatchedCsatEntry } from "./batched-csat-entry.js";

/** A rule a batched csat entry must pass. Check returns its problems, or none. */
export interface BatchedCsatEntryRule {
  check(item: BatchedCsatEntry): string[];
}

export class BatchedCsatEntryRequiredDescriptionRule implements BatchedCsatEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCsatEntry): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCsatEntryAttemptsRangeRule implements BatchedCsatEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCsatEntry): string[] {
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

export class BatchedCsatEntryMaximumRangeRule implements BatchedCsatEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCsatEntry): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched csat entry. */
export class BatchedCsatEntryValidator {
  rules: BatchedCsatEntryRule[];

  constructor(rules: BatchedCsatEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCsatEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedCsatEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCsatEntry[]): Map<string, string[]> {
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

export function defaultBatchedCsatEntryValidator(): BatchedCsatEntryValidator {
  return new BatchedCsatEntryValidator(
    [
      new BatchedCsatEntryRequiredDescriptionRule("batched csat entry needs a value"),
      new BatchedCsatEntryAttemptsRangeRule(255, 86400),
      new BatchedCsatEntryMaximumRangeRule(10, 2959),
    ],
  );
}
