import * as text from "../../../../kit/text.js";
import { BatchedEscalationRollup } from "./batched-escalation-rollup.js";

/** A rule a batched escalation rollup must pass. Check returns its problems, or none. */
export interface BatchedEscalationRollupRule {
  check(item: BatchedEscalationRollup): string[];
}

export class BatchedEscalationRollupRequiredExternalRefRule implements BatchedEscalationRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedEscalationRollup): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedEscalationRollupCodePrefixRule implements BatchedEscalationRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedEscalationRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedEscalationRollupAllowedTitleRule implements BatchedEscalationRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedEscalationRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class BatchedEscalationRollupRequiredOwnerIdRule implements BatchedEscalationRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedEscalationRollup): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched escalation rollup. */
export class BatchedEscalationRollupValidator {
  rules: BatchedEscalationRollupRule[];

  constructor(rules: BatchedEscalationRollupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedEscalationRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedEscalationRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedEscalationRollup[]): Map<string, string[]> {
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

export function defaultBatchedEscalationRollupValidator(): BatchedEscalationRollupValidator {
  return new BatchedEscalationRollupValidator(
    [
      new BatchedEscalationRollupRequiredExternalRefRule("batched escalation rollup needs an entry"),
      new BatchedEscalationRollupCodePrefixRule("Q"),
      new BatchedEscalationRollupAllowedTitleRule(["fallback", "weighted"]),
      new BatchedEscalationRollupRequiredOwnerIdRule("batched escalation rollup needs this field"),
    ],
  );
}
