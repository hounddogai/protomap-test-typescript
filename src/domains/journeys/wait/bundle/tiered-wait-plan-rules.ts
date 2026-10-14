import { TieredWaitPlan } from "./tiered-wait-plan.js";

/** A rule a tiered wait plan must pass. Check returns its problems, or none. */
export interface TieredWaitPlanRule {
  check(item: TieredWaitPlan): string[];
}

export class TieredWaitPlanExpiresAtRangeRule implements TieredWaitPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWaitPlan): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredWaitPlanCodePrefixRule implements TieredWaitPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredWaitPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredWaitPlanDiscountRangeRule implements TieredWaitPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWaitPlan): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredWaitPlanCodeLengthRule implements TieredWaitPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWaitPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered wait plan. */
export class TieredWaitPlanValidator {
  rules: TieredWaitPlanRule[];

  constructor(rules: TieredWaitPlanRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWaitPlan): string[] {
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

  requireValid(item: TieredWaitPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWaitPlan[]): Map<string, string[]> {
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

export function defaultTieredWaitPlanValidator(): TieredWaitPlanValidator {
  return new TieredWaitPlanValidator(
    [
      new TieredWaitPlanExpiresAtRangeRule(80, 1000),
      new TieredWaitPlanCodePrefixRule("ACM"),
      new TieredWaitPlanDiscountRangeRule(2.6, 248.8),
      new TieredWaitPlanCodeLengthRule(64),
    ],
  );
}
