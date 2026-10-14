import * as text from "../../../../kit/text.js";
import { FallbackPathBatch } from "./fallback-path-batch.js";

/** A rule a fallback path batch must pass. Check returns its problems, or none. */
export interface FallbackPathBatchRule {
  check(item: FallbackPathBatch): string[];
}

export class FallbackPathBatchLabelLengthRule implements FallbackPathBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPathBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPathBatchRequiredLabelRule implements FallbackPathBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPathBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPathBatchAllowedExternalRefRule implements FallbackPathBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPathBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

/** Runs every rule of a fallback path batch. */
export class FallbackPathBatchValidator {
  rules: FallbackPathBatchRule[];

  constructor(rules: FallbackPathBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPathBatch): string[] {
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

  requireValid(item: FallbackPathBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPathBatch[]): Map<string, string[]> {
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

export function defaultFallbackPathBatchValidator(): FallbackPathBatchValidator {
  return new FallbackPathBatchValidator(
    [
      new FallbackPathBatchLabelLengthRule(86400),
      new FallbackPathBatchRequiredLabelRule("fallback path batch needs this field"),
      new FallbackPathBatchAllowedExternalRefRule(["rolling"]),
    ],
  );
}
