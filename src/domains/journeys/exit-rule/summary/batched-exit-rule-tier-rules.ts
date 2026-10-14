import * as text from "../../../../kit/text.js";
import { BatchedExitRuleTier } from "./batched-exit-rule-tier.js";

/** A rule a batched exit rule tier must pass. Check returns its problems, or none. */
export interface BatchedExitRuleTierRule {
  check(item: BatchedExitRuleTier): string[];
}

export class BatchedExitRuleTierCodeLengthRule implements BatchedExitRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedExitRuleTierAllowedOwnerIdRule implements BatchedExitRuleTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedExitRuleTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is not allowed`];
    return [];
  }
}

export class BatchedExitRuleTierOwnerIdLengthRule implements BatchedExitRuleTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleTier): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedExitRuleTierRequiredChecksumRule implements BatchedExitRuleTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleTier): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleTierActiveGuardRule implements BatchedExitRuleTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedExitRuleTier): string[] {
    if (item.active && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a batched exit rule tier. */
export class BatchedExitRuleTierValidator {
  rules: BatchedExitRuleTierRule[];

  constructor(rules: BatchedExitRuleTierRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedExitRuleTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedExitRuleTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedExitRuleTier[]): Map<string, string[]> {
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

export function defaultBatchedExitRuleTierValidator(): BatchedExitRuleTierValidator {
  return new BatchedExitRuleTierValidator(
    [
      new BatchedExitRuleTierCodeLengthRule(1000),
      new BatchedExitRuleTierAllowedOwnerIdRule(["manual", "manual"]),
      new BatchedExitRuleTierOwnerIdLengthRule(80),
      new BatchedExitRuleTierRequiredChecksumRule("batched exit rule tier needs this field"),
      new BatchedExitRuleTierActiveGuardRule(80),
    ],
  );
}
