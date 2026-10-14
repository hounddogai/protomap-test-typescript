import { FraudCheckRule } from "./fraud-check-rule.js";

/** A rule a fraud check rule must pass. Check returns its problems, or none. */
export interface FraudCheckRuleRule {
  check(item: FraudCheckRule): string[];
}

export class FraudCheckRuleRequiredSegmentRule implements FraudCheckRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRule): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckRuleCreatedAtRangeRule implements FraudCheckRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckRule): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckRuleRequiredCodeRule implements FraudCheckRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check rule. */
export class FraudCheckRuleValidator {
  rules: FraudCheckRuleRule[];

  constructor(rules: FraudCheckRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckRule): string[] {
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

  requireValid(item: FraudCheckRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckRule[]): Map<string, string[]> {
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

export function defaultFraudCheckRuleValidator(): FraudCheckRuleValidator {
  return new FraudCheckRuleValidator(
    [
      new FraudCheckRuleRequiredSegmentRule("fraud check rule needs a value"),
      new FraudCheckRuleCreatedAtRangeRule(1000, 86400),
      new FraudCheckRuleRequiredCodeRule("fraud check rule needs a value"),
    ],
  );
}
