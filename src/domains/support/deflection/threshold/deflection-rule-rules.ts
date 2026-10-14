import { DeflectionRule } from "./deflection-rule.js";

/** A rule a deflection rule must pass. Check returns its problems, or none. */
export interface DeflectionRuleRule {
  check(item: DeflectionRule): string[];
}

export class DeflectionRuleCodeLengthRule implements DeflectionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionRuleStartsAtRangeRule implements DeflectionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionRule): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionRuleNameLengthRule implements DeflectionRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection rule. */
export class DeflectionRuleValidator {
  rules: DeflectionRuleRule[];

  constructor(rules: DeflectionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionRule[]): Map<string, string[]> {
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

export function defaultDeflectionRuleValidator(): DeflectionRuleValidator {
  return new DeflectionRuleValidator(
    [
      new DeflectionRuleCodeLengthRule(80),
      new DeflectionRuleStartsAtRangeRule(120, 86400),
      new DeflectionRuleNameLengthRule(86400),
    ],
  );
}
