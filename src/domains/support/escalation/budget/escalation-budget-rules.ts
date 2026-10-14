import * as text from "../../../../kit/text.js";
import { EscalationBudget } from "./escalation-budget.js";

/** A rule a escalation budget must pass. Check returns its problems, or none. */
export interface EscalationBudgetRule {
  check(item: EscalationBudget): string[];
}

export class EscalationBudgetRequiredTitleRule implements EscalationBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationBudgetAllowedCodeRule implements EscalationBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class EscalationBudgetCodePrefixRule implements EscalationBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a escalation budget. */
export class EscalationBudgetValidator {
  rules: EscalationBudgetRule[];

  constructor(rules: EscalationBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationBudget): string[] {
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

  requireValid(item: EscalationBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationBudget[]): Map<string, string[]> {
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

export function defaultEscalationBudgetValidator(): EscalationBudgetValidator {
  return new EscalationBudgetValidator(
    [
      new EscalationBudgetRequiredTitleRule("escalation budget needs this field"),
      new EscalationBudgetAllowedCodeRule(["global"]),
      new EscalationBudgetCodePrefixRule("REF"),
    ],
  );
}
