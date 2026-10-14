import { DefaultExitRuleClaim } from "./default-exit-rule-claim.js";

/** A rule a default exit rule claim must pass. Check returns its problems, or none. */
export interface DefaultExitRuleClaimRule {
  check(item: DefaultExitRuleClaim): string[];
}

export class DefaultExitRuleClaimRequiredCodeRule implements DefaultExitRuleClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultExitRuleClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultExitRuleClaimLabelLengthRule implements DefaultExitRuleClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultExitRuleClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultExitRuleClaimImpressionsRangeRule implements DefaultExitRuleClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultExitRuleClaim): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultExitRuleClaimRequiredLabelRule implements DefaultExitRuleClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultExitRuleClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default exit rule claim. */
export class DefaultExitRuleClaimValidator {
  rules: DefaultExitRuleClaimRule[];

  constructor(rules: DefaultExitRuleClaimRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultExitRuleClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultExitRuleClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultExitRuleClaim[]): Map<string, string[]> {
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

export function defaultDefaultExitRuleClaimValidator(): DefaultExitRuleClaimValidator {
  return new DefaultExitRuleClaimValidator(
    [
      new DefaultExitRuleClaimRequiredCodeRule("default exit rule claim needs a value"),
      new DefaultExitRuleClaimLabelLengthRule(86400),
      new DefaultExitRuleClaimImpressionsRangeRule(80, 86400),
      new DefaultExitRuleClaimRequiredLabelRule("default exit rule claim needs a value"),
    ],
  );
}
