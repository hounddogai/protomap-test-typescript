import { BatchedInsightGroup } from "./batched-insight-group.js";

/** A rule a batched insight group must pass. Check returns its problems, or none. */
export interface BatchedInsightGroupRule {
  check(item: BatchedInsightGroup): string[];
}

export class BatchedInsightGroupRequiredLabelRule implements BatchedInsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInsightGroupMinimumRangeRule implements BatchedInsightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInsightGroup): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedInsightGroupCodeLengthRule implements BatchedInsightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInsightGroupSequenceRangeRule implements BatchedInsightGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInsightGroup): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedInsightGroupLabelLengthRule implements BatchedInsightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInsightGroupRequiredCodeRule implements BatchedInsightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched insight group. */
export class BatchedInsightGroupValidator {
  rules: BatchedInsightGroupRule[];

  constructor(rules: BatchedInsightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInsightGroup): string[] {
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

  requireValid(item: BatchedInsightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInsightGroup[]): Map<string, string[]> {
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

export function defaultBatchedInsightGroupValidator(): BatchedInsightGroupValidator {
  return new BatchedInsightGroupValidator(
    [
      new BatchedInsightGroupRequiredLabelRule("batched insight group needs a value"),
      new BatchedInsightGroupMinimumRangeRule(4.8, 785.1),
      new BatchedInsightGroupCodeLengthRule(1000),
      new BatchedInsightGroupSequenceRangeRule(16, 16),
      new BatchedInsightGroupLabelLengthRule(3600),
      new BatchedInsightGroupRequiredCodeRule("batched insight group needs this field"),
    ],
  );
}
