import * as text from "../../../../kit/text.js";
import { BatchedWaitRule } from "./batched-wait-rule.js";

/** A rule a batched wait rule must pass. Check returns its problems, or none. */
export interface BatchedWaitRuleRule {
  check(item: BatchedWaitRule): string[];
}

export class BatchedWaitRuleRequiredTitleRule implements BatchedWaitRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitRuleAllowedCodeRule implements BatchedWaitRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedWaitRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class BatchedWaitRuleCodePrefixRule implements BatchedWaitRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedWaitRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedWaitRuleRequiredCodeRule implements BatchedWaitRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitRuleLimitRangeRule implements BatchedWaitRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWaitRule): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched wait rule. */
export class BatchedWaitRuleValidator {
  rules: BatchedWaitRuleRule[];

  constructor(rules: BatchedWaitRuleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWaitRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedWaitRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWaitRule[]): Map<string, string[]> {
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

export function defaultBatchedWaitRuleValidator(): BatchedWaitRuleValidator {
  return new BatchedWaitRuleValidator(
    [
      new BatchedWaitRuleRequiredTitleRule("batched wait rule needs an entry"),
      new BatchedWaitRuleAllowedCodeRule([]),
      new BatchedWaitRuleCodePrefixRule("X"),
      new BatchedWaitRuleRequiredCodeRule("batched wait rule needs an entry"),
      new BatchedWaitRuleLimitRangeRule(120, 255),
    ],
  );
}
