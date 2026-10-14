import * as text from "../../../../kit/text.js";
import { BatchedFlightGroup } from "./batched-flight-group.js";

/** A rule a batched flight group must pass. Check returns its problems, or none. */
export interface BatchedFlightGroupRule {
  check(item: BatchedFlightGroup): string[];
}

export class BatchedFlightGroupRequiredCodeRule implements BatchedFlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightGroupRequiredLabelRule implements BatchedFlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightGroupLabelLengthRule implements BatchedFlightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFlightGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFlightGroupAllowedLabelRule implements BatchedFlightGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFlightGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

/** Runs every rule of a batched flight group. */
export class BatchedFlightGroupValidator {
  rules: BatchedFlightGroupRule[];

  constructor(rules: BatchedFlightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFlightGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFlightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFlightGroup[]): Map<string, string[]> {
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

export function defaultBatchedFlightGroupValidator(): BatchedFlightGroupValidator {
  return new BatchedFlightGroupValidator(
    [
      new BatchedFlightGroupRequiredCodeRule("batched flight group needs a value"),
      new BatchedFlightGroupRequiredLabelRule("batched flight group needs a value"),
      new BatchedFlightGroupLabelLengthRule(120),
      new BatchedFlightGroupAllowedLabelRule(["scheduled", "regional"]),
    ],
  );
}
