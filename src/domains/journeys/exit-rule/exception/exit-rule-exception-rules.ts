import * as text from "../../../../kit/text.js";
import { ExitRuleException } from "./exit-rule-exception.js";

/** A rule a exit rule exception must pass. Check returns its problems, or none. */
export interface ExitRuleExceptionRule {
  check(item: ExitRuleException): string[];
}

export class ExitRuleExceptionBidRangeRule implements ExitRuleExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleException): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleExceptionCodePrefixRule implements ExitRuleExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleExceptionAllowedCodeRule implements ExitRuleExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class ExitRuleExceptionRequiredCodeRule implements ExitRuleExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule exception. */
export class ExitRuleExceptionValidator {
  rules: ExitRuleExceptionRule[];

  constructor(rules: ExitRuleExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleException): string[] {
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

  requireValid(item: ExitRuleException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleException[]): Map<string, string[]> {
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

export function defaultExitRuleExceptionValidator(): ExitRuleExceptionValidator {
  return new ExitRuleExceptionValidator(
    [
      new ExitRuleExceptionBidRangeRule(9, 3856.4),
      new ExitRuleExceptionCodePrefixRule("X"),
      new ExitRuleExceptionAllowedCodeRule(["seasonal", "pending", "seasonal"]),
      new ExitRuleExceptionRequiredCodeRule("exit rule exception needs an entry"),
    ],
  );
}
