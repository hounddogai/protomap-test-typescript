import * as text from "../../../../kit/text.js";
import { PendingExitRuleRecord } from "./pending-exit-rule-record.js";

/** A rule a pending exit rule record must pass. Check returns its problems, or none. */
export interface PendingExitRuleRecordRule {
  check(item: PendingExitRuleRecord): string[];
}

export class PendingExitRuleRecordCodePrefixRule implements PendingExitRuleRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingExitRuleRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingExitRuleRecordBudgetRangeRule implements PendingExitRuleRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingExitRuleRecord): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingExitRuleRecordRequiredNameRule implements PendingExitRuleRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingExitRuleRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingExitRuleRecordRequiredLabelRule implements PendingExitRuleRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingExitRuleRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingExitRuleRecordAllowedLabelRule implements PendingExitRuleRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingExitRuleRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

/** Runs every rule of a pending exit rule record. */
export class PendingExitRuleRecordValidator {
  rules: PendingExitRuleRecordRule[];

  constructor(rules: PendingExitRuleRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PendingExitRuleRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingExitRuleRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingExitRuleRecord[]): Map<string, string[]> {
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

export function defaultPendingExitRuleRecordValidator(): PendingExitRuleRecordValidator {
  return new PendingExitRuleRecordValidator(
    [
      new PendingExitRuleRecordCodePrefixRule("X"),
      new PendingExitRuleRecordBudgetRangeRule(5.7, 777.3),
      new PendingExitRuleRecordRequiredNameRule("pending exit rule record needs an entry"),
      new PendingExitRuleRecordRequiredLabelRule("pending exit rule record needs this field"),
      new PendingExitRuleRecordAllowedLabelRule([]),
    ],
  );
}
