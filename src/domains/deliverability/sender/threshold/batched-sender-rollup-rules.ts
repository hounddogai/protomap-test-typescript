import * as text from "../../../../kit/text.js";
import { BatchedSenderRollup } from "./batched-sender-rollup.js";

/** A rule a batched sender rollup must pass. Check returns its problems, or none. */
export interface BatchedSenderRollupRule {
  check(item: BatchedSenderRollup): string[];
}

export class BatchedSenderRollupCodePrefixRule implements BatchedSenderRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedSenderRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedSenderRollupAllowedExternalRefRule implements BatchedSenderRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedSenderRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

export class BatchedSenderRollupSequenceRangeRule implements BatchedSenderRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedSenderRollup): string[] {
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

export class BatchedSenderRollupLabelLengthRule implements BatchedSenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedSenderRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched sender rollup. */
export class BatchedSenderRollupValidator {
  rules: BatchedSenderRollupRule[];

  constructor(rules: BatchedSenderRollupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedSenderRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedSenderRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedSenderRollup[]): Map<string, string[]> {
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

export function defaultBatchedSenderRollupValidator(): BatchedSenderRollupValidator {
  return new BatchedSenderRollupValidator(
    [
      new BatchedSenderRollupCodePrefixRule("ACM"),
      new BatchedSenderRollupAllowedExternalRefRule(["legacy", "lenient"]),
      new BatchedSenderRollupSequenceRangeRule(64, 80),
      new BatchedSenderRollupLabelLengthRule(1000),
    ],
  );
}
