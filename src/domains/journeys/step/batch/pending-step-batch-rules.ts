import { PendingStepBatch } from "./pending-step-batch.js";

/** A rule a pending step batch must pass. Check returns its problems, or none. */
export interface PendingStepBatchRule {
  check(item: PendingStepBatch): string[];
}

export class PendingStepBatchRequiredDescriptionRule implements PendingStepBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStepBatch): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStepBatchCodePrefixRule implements PendingStepBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingStepBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingStepBatchUpdatedAtRangeRule implements PendingStepBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingStepBatch): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingStepBatchBudgetRangeRule implements PendingStepBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingStepBatch): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending step batch. */
export class PendingStepBatchValidator {
  rules: PendingStepBatchRule[];

  constructor(rules: PendingStepBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PendingStepBatch): string[] {
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

  requireValid(item: PendingStepBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingStepBatch[]): Map<string, string[]> {
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

export function defaultPendingStepBatchValidator(): PendingStepBatchValidator {
  return new PendingStepBatchValidator(
    [
      new PendingStepBatchRequiredDescriptionRule("pending step batch needs an entry"),
      new PendingStepBatchCodePrefixRule("ACM"),
      new PendingStepBatchUpdatedAtRangeRule(80, 80),
      new PendingStepBatchBudgetRangeRule(3.7, 2833.2),
    ],
  );
}
