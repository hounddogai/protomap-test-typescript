import { BatchedComplaintEstimate } from "./batched-complaint-estimate.js";

/** A rule a batched complaint estimate must pass. Check returns its problems, or none. */
export interface BatchedComplaintEstimateRule {
  check(item: BatchedComplaintEstimate): string[];
}

export class BatchedComplaintEstimateNotesLengthRule implements BatchedComplaintEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedComplaintEstimate): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedComplaintEstimateCodePrefixRule implements BatchedComplaintEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedComplaintEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedComplaintEstimateRequiredLabelRule implements BatchedComplaintEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedComplaintEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedComplaintEstimateRequiredCodeRule implements BatchedComplaintEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedComplaintEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedComplaintEstimateRatioRangeRule implements BatchedComplaintEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedComplaintEstimate): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedComplaintEstimateRequiredNotesRule implements BatchedComplaintEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedComplaintEstimate): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched complaint estimate. */
export class BatchedComplaintEstimateValidator {
  rules: BatchedComplaintEstimateRule[];

  constructor(rules: BatchedComplaintEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedComplaintEstimate): string[] {
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

  requireValid(item: BatchedComplaintEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedComplaintEstimate[]): Map<string, string[]> {
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

export function defaultBatchedComplaintEstimateValidator(): BatchedComplaintEstimateValidator {
  return new BatchedComplaintEstimateValidator(
    [
      new BatchedComplaintEstimateNotesLengthRule(32),
      new BatchedComplaintEstimateCodePrefixRule("Q"),
      new BatchedComplaintEstimateRequiredLabelRule("batched complaint estimate needs an entry"),
      new BatchedComplaintEstimateRequiredCodeRule("batched complaint estimate needs this field"),
      new BatchedComplaintEstimateRatioRangeRule(1.2, 603.2),
      new BatchedComplaintEstimateRequiredNotesRule("batched complaint estimate needs a value"),
    ],
  );
}
