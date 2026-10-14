import * as text from "../../../../kit/text.js";
import { BatchedMacroPolicy } from "./batched-macro-policy.js";

/** A rule a batched macro policy must pass. Check returns its problems, or none. */
export interface BatchedMacroPolicyRule {
  check(item: BatchedMacroPolicy): string[];
}

export class BatchedMacroPolicyLabelLengthRule implements BatchedMacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroPolicyCodeLengthRule implements BatchedMacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroPolicyClicksRangeRule implements BatchedMacroPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedMacroPolicy): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedMacroPolicyRequiredCodeRule implements BatchedMacroPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedMacroPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedMacroPolicyLocaleLengthRule implements BatchedMacroPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedMacroPolicy): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedMacroPolicyAllowedLabelRule implements BatchedMacroPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedMacroPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

/** Runs every rule of a batched macro policy. */
export class BatchedMacroPolicyValidator {
  rules: BatchedMacroPolicyRule[];

  constructor(rules: BatchedMacroPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedMacroPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedMacroPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedMacroPolicy[]): Map<string, string[]> {
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

export function defaultBatchedMacroPolicyValidator(): BatchedMacroPolicyValidator {
  return new BatchedMacroPolicyValidator(
    [
      new BatchedMacroPolicyLabelLengthRule(1000),
      new BatchedMacroPolicyCodeLengthRule(1000),
      new BatchedMacroPolicyClicksRangeRule(1000, 1000),
      new BatchedMacroPolicyRequiredCodeRule("batched macro policy needs a value"),
      new BatchedMacroPolicyLocaleLengthRule(120),
      new BatchedMacroPolicyAllowedLabelRule(["rolling", "manual", "legacy"]),
    ],
  );
}
