import * as text from "../../../../kit/text.js";
import { CreditPlan } from "./credit-plan.js";

/** A rule a credit plan must pass. Check returns its problems, or none. */
export interface CreditPlanRule {
  check(item: CreditPlan): string[];
}

export class CreditPlanQuantityRangeRule implements CreditPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditPlan): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditPlanNameLengthRule implements CreditPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditPlanAudienceIdLengthRule implements CreditPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditPlan): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditPlanAllowedCodeRule implements CreditPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class CreditPlanCodePrefixRule implements CreditPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit plan. */
export class CreditPlanValidator {
  rules: CreditPlanRule[];

  constructor(rules: CreditPlanRule[]) {
    this.rules = rules;
  }

  validate(item: CreditPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditPlan[]): Map<string, string[]> {
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

export function defaultCreditPlanValidator(): CreditPlanValidator {
  return new CreditPlanValidator(
    [
      new CreditPlanQuantityRangeRule(16, 32),
      new CreditPlanNameLengthRule(64),
      new CreditPlanAudienceIdLengthRule(3600),
      new CreditPlanAllowedCodeRule([]),
      new CreditPlanCodePrefixRule("Q"),
    ],
  );
}
