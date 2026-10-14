import { RetentionRule } from "./retention-rule.js";

/** A rule a retention rule must pass. Check returns its problems, or none. */
export interface RetentionRuleRule {
  check(item: RetentionRule): string[];
}

export class RetentionRuleNameLengthRule implements RetentionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionRuleRequiredCodeRule implements RetentionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionRuleUpdatedAtRangeRule implements RetentionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionRule): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionRuleBudgetRangeRule implements RetentionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionRule): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a retention rule. */
export class RetentionRuleValidator {
  rules: RetentionRuleRule[];

  constructor(rules: RetentionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionRule[]): Map<string, string[]> {
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

export function defaultRetentionRuleValidator(): RetentionRuleValidator {
  return new RetentionRuleValidator(
    [
      new RetentionRuleNameLengthRule(80),
      new RetentionRuleRequiredCodeRule("retention rule needs this field"),
      new RetentionRuleUpdatedAtRangeRule(32, 1000),
      new RetentionRuleBudgetRangeRule(9.2, 1293.8),
    ],
  );
}
