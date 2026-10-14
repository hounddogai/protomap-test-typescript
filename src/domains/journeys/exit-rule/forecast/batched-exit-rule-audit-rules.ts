import * as text from "../../../../kit/text.js";
import { BatchedExitRuleAudit } from "./batched-exit-rule-audit.js";

/** A rule a batched exit rule audit must pass. Check returns its problems, or none. */
export interface BatchedExitRuleAuditRule {
  check(item: BatchedExitRuleAudit): string[];
}

export class BatchedExitRuleAuditCodePrefixRule implements BatchedExitRuleAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedExitRuleAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedExitRuleAuditRequiredCodeRule implements BatchedExitRuleAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleAuditRequiredTitleRule implements BatchedExitRuleAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedExitRuleAudit): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedExitRuleAuditAllowedTitleRule implements BatchedExitRuleAuditRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedExitRuleAudit): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class BatchedExitRuleAuditImpressionsRangeRule implements BatchedExitRuleAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedExitRuleAudit): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedExitRuleAuditCodeLengthRule implements BatchedExitRuleAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedExitRuleAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched exit rule audit. */
export class BatchedExitRuleAuditValidator {
  rules: BatchedExitRuleAuditRule[];

  constructor(rules: BatchedExitRuleAuditRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedExitRuleAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedExitRuleAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedExitRuleAudit[]): Map<string, string[]> {
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

export function defaultBatchedExitRuleAuditValidator(): BatchedExitRuleAuditValidator {
  return new BatchedExitRuleAuditValidator(
    [
      new BatchedExitRuleAuditCodePrefixRule("REF"),
      new BatchedExitRuleAuditRequiredCodeRule("batched exit rule audit needs a value"),
      new BatchedExitRuleAuditRequiredTitleRule("batched exit rule audit needs a value"),
      new BatchedExitRuleAuditAllowedTitleRule(["adaptive"]),
      new BatchedExitRuleAuditImpressionsRangeRule(32, 1000),
      new BatchedExitRuleAuditCodeLengthRule(3600),
    ],
  );
}
