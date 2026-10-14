import * as text from "../../../../kit/text.js";
import { ExitRuleVariance } from "./exit-rule-variance.js";

/** A rule a exit rule variance must pass. Check returns its problems, or none. */
export interface ExitRuleVarianceRule {
  check(item: ExitRuleVariance): string[];
}

export class ExitRuleVarianceExpiresAtRangeRule implements ExitRuleVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleVariance): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleVarianceAllowedDescriptionRule implements ExitRuleVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is blocked`];
    return [];
  }
}

export class ExitRuleVarianceRequiredCodeRule implements ExitRuleVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule variance. */
export class ExitRuleVarianceValidator {
  rules: ExitRuleVarianceRule[];

  constructor(rules: ExitRuleVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleVariance[]): Map<string, string[]> {
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

export function defaultExitRuleVarianceValidator(): ExitRuleVarianceValidator {
  return new ExitRuleVarianceValidator(
    [
      new ExitRuleVarianceExpiresAtRangeRule(16, 32),
      new ExitRuleVarianceAllowedDescriptionRule(["scheduled"]),
      new ExitRuleVarianceRequiredCodeRule("exit rule variance needs this field"),
    ],
  );
}
