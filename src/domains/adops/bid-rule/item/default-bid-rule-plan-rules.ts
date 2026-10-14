import { DefaultBidRulePlan } from "./default-bid-rule-plan.js";

/** A rule a default bid rule plan must pass. Check returns its problems, or none. */
export interface DefaultBidRulePlanRule {
  check(item: DefaultBidRulePlan): string[];
}

export class DefaultBidRulePlanDurationMinutesRangeRule implements DefaultBidRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBidRulePlan): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultBidRulePlanRatioRangeRule implements DefaultBidRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBidRulePlan): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultBidRulePlanExpiresAtRangeRule implements DefaultBidRulePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultBidRulePlan): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default bid rule plan. */
export class DefaultBidRulePlanValidator {
  rules: DefaultBidRulePlanRule[];

  constructor(rules: DefaultBidRulePlanRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultBidRulePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultBidRulePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultBidRulePlan[]): Map<string, string[]> {
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

export function defaultDefaultBidRulePlanValidator(): DefaultBidRulePlanValidator {
  return new DefaultBidRulePlanValidator(
    [
      new DefaultBidRulePlanDurationMinutesRangeRule(120, 255),
      new DefaultBidRulePlanRatioRangeRule(2.4, 793.7),
      new DefaultBidRulePlanExpiresAtRangeRule(32, 64),
    ],
  );
}
