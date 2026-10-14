import { PayoutPlan } from "./payout-plan.js";

/** A rule a payout plan must pass. Check returns its problems, or none. */
export interface PayoutPlanRule {
  check(item: PayoutPlan): string[];
}

export class PayoutPlanRequiredCodeRule implements PayoutPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutPlanCodePrefixRule implements PayoutPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutPlanRequiredNameRule implements PayoutPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutPlanNameLengthRule implements PayoutPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutPlanCodeLengthRule implements PayoutPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutPlanRequiredSummaryRule implements PayoutPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutPlan): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout plan. */
export class PayoutPlanValidator {
  rules: PayoutPlanRule[];

  constructor(rules: PayoutPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutPlan[]): Map<string, string[]> {
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

export function defaultPayoutPlanValidator(): PayoutPlanValidator {
  return new PayoutPlanValidator(
    [
      new PayoutPlanRequiredCodeRule("payout plan needs this field"),
      new PayoutPlanCodePrefixRule("ACM"),
      new PayoutPlanRequiredNameRule("payout plan needs this field"),
      new PayoutPlanNameLengthRule(3600),
      new PayoutPlanCodeLengthRule(3600),
      new PayoutPlanRequiredSummaryRule("payout plan needs a value"),
    ],
  );
}
