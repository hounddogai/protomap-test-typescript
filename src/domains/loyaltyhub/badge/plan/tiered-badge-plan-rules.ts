import { TieredBadgePlan } from "./tiered-badge-plan.js";

/** A rule a tiered badge plan must pass. Check returns its problems, or none. */
export interface TieredBadgePlanRule {
  check(item: TieredBadgePlan): string[];
}

export class TieredBadgePlanCohortLengthRule implements TieredBadgePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBadgePlan): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBadgePlanCostRangeRule implements TieredBadgePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBadgePlan): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBadgePlanCodePrefixRule implements TieredBadgePlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredBadgePlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredBadgePlanRequiredCohortRule implements TieredBadgePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBadgePlan): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered badge plan. */
export class TieredBadgePlanValidator {
  rules: TieredBadgePlanRule[];

  constructor(rules: TieredBadgePlanRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBadgePlan): string[] {
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

  requireValid(item: TieredBadgePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBadgePlan[]): Map<string, string[]> {
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

export function defaultTieredBadgePlanValidator(): TieredBadgePlanValidator {
  return new TieredBadgePlanValidator(
    [
      new TieredBadgePlanCohortLengthRule(64),
      new TieredBadgePlanCostRangeRule(8.8, 2313.7),
      new TieredBadgePlanCodePrefixRule("Q"),
      new TieredBadgePlanRequiredCohortRule("tiered badge plan needs an entry"),
    ],
  );
}
