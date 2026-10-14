import * as text from "../../../../kit/text.js";
import { PendingFraudCheckRule } from "./pending-fraud-check-rule.js";

/** A rule a pending fraud check rule must pass. Check returns its problems, or none. */
export interface PendingFraudCheckRuleRule {
  check(item: PendingFraudCheckRule): string[];
}

export class PendingFraudCheckRuleRequiredUnitRule implements PendingFraudCheckRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFraudCheckRule): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFraudCheckRuleAllowedTimezoneRule implements PendingFraudCheckRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingFraudCheckRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is above maximum`];
    return [];
  }
}

export class PendingFraudCheckRuleCapacityRangeRule implements PendingFraudCheckRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFraudCheckRule): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingFraudCheckRuleUnitLengthRule implements PendingFraudCheckRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFraudCheckRule): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending fraud check rule. */
export class PendingFraudCheckRuleValidator {
  rules: PendingFraudCheckRuleRule[];

  constructor(rules: PendingFraudCheckRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFraudCheckRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingFraudCheckRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFraudCheckRule[]): Map<string, string[]> {
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

export function defaultPendingFraudCheckRuleValidator(): PendingFraudCheckRuleValidator {
  return new PendingFraudCheckRuleValidator(
    [
      new PendingFraudCheckRuleRequiredUnitRule("pending fraud check rule needs a value"),
      new PendingFraudCheckRuleAllowedTimezoneRule(["lenient", "regional", "regional"]),
      new PendingFraudCheckRuleCapacityRangeRule(80, 80),
      new PendingFraudCheckRuleUnitLengthRule(16),
    ],
  );
}
