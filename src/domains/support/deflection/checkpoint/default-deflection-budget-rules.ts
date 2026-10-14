import * as text from "../../../../kit/text.js";
import { DefaultDeflectionBudget } from "./default-deflection-budget.js";

/** A rule a default deflection budget must pass. Check returns its problems, or none. */
export interface DefaultDeflectionBudgetRule {
  check(item: DefaultDeflectionBudget): string[];
}

export class DefaultDeflectionBudgetRegionLengthRule implements DefaultDeflectionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultDeflectionBudget): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultDeflectionBudgetAllowedContactEmailRule implements DefaultDeflectionBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultDeflectionBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is blocked`];
    return [];
  }
}

export class DefaultDeflectionBudgetCodePrefixRule implements DefaultDeflectionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultDeflectionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default deflection budget. */
export class DefaultDeflectionBudgetValidator {
  rules: DefaultDeflectionBudgetRule[];

  constructor(rules: DefaultDeflectionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultDeflectionBudget): string[] {
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

  requireValid(item: DefaultDeflectionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultDeflectionBudget[]): Map<string, string[]> {
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

export function defaultDefaultDeflectionBudgetValidator(): DefaultDeflectionBudgetValidator {
  return new DefaultDeflectionBudgetValidator(
    [
      new DefaultDeflectionBudgetRegionLengthRule(86400),
      new DefaultDeflectionBudgetAllowedContactEmailRule(["legacy", "capped"]),
      new DefaultDeflectionBudgetCodePrefixRule("OPS"),
    ],
  );
}
