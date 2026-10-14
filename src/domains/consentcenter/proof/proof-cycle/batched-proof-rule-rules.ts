import * as text from "../../../../kit/text.js";
import { BatchedProofRule } from "./batched-proof-rule.js";

/** A rule a batched proof rule must pass. Check returns its problems, or none. */
export interface BatchedProofRuleRule {
  check(item: BatchedProofRule): string[];
}

export class BatchedProofRuleRequiredCodeRule implements BatchedProofRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedProofRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedProofRuleAllowedCodeRule implements BatchedProofRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedProofRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class BatchedProofRuleRequiredTitleRule implements BatchedProofRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedProofRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedProofRuleCodeLengthRule implements BatchedProofRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedProofRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched proof rule. */
export class BatchedProofRuleValidator {
  rules: BatchedProofRuleRule[];

  constructor(rules: BatchedProofRuleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedProofRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedProofRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedProofRule[]): Map<string, string[]> {
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

export function defaultBatchedProofRuleValidator(): BatchedProofRuleValidator {
  return new BatchedProofRuleValidator(
    [
      new BatchedProofRuleRequiredCodeRule("batched proof rule needs this field"),
      new BatchedProofRuleAllowedCodeRule(["lenient", "fallback", "adaptive"]),
      new BatchedProofRuleRequiredTitleRule("batched proof rule needs a value"),
      new BatchedProofRuleCodeLengthRule(16),
    ],
  );
}
