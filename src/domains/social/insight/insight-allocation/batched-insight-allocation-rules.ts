import { BatchedInsightAllocation } from "./batched-insight-allocation.js";

/** A rule a batched insight allocation must pass. Check returns its problems, or none. */
export interface BatchedInsightAllocationRule {
  check(item: BatchedInsightAllocation): string[];
}

export class BatchedInsightAllocationSourceLengthRule implements BatchedInsightAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightAllocation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInsightAllocationCodeLengthRule implements BatchedInsightAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInsightAllocationRequiredSourceRule implements BatchedInsightAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightAllocation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInsightAllocationCodePrefixRule implements BatchedInsightAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedInsightAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedInsightAllocationRequiredCodeRule implements BatchedInsightAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInsightAllocationRequiredLabelRule implements BatchedInsightAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInsightAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched insight allocation. */
export class BatchedInsightAllocationValidator {
  rules: BatchedInsightAllocationRule[];

  constructor(rules: BatchedInsightAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInsightAllocation): string[] {
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

  requireValid(item: BatchedInsightAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInsightAllocation[]): Map<string, string[]> {
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

export function defaultBatchedInsightAllocationValidator(): BatchedInsightAllocationValidator {
  return new BatchedInsightAllocationValidator(
    [
      new BatchedInsightAllocationSourceLengthRule(64),
      new BatchedInsightAllocationCodeLengthRule(3600),
      new BatchedInsightAllocationRequiredSourceRule("batched insight allocation needs this field"),
      new BatchedInsightAllocationCodePrefixRule("OPS"),
      new BatchedInsightAllocationRequiredCodeRule("batched insight allocation needs a value"),
      new BatchedInsightAllocationRequiredLabelRule("batched insight allocation needs this field"),
    ],
  );
}
