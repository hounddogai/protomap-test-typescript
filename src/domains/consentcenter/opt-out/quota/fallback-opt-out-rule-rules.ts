import { FallbackOptOutRule } from "./fallback-opt-out-rule.js";

/** A rule a fallback opt out rule must pass. Check returns its problems, or none. */
export interface FallbackOptOutRuleRule {
  check(item: FallbackOptOutRule): string[];
}

export class FallbackOptOutRuleAudienceIdLengthRule implements FallbackOptOutRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackOptOutRule): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackOptOutRuleRetriesRangeRule implements FallbackOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackOptOutRule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackOptOutRuleBudgetRangeRule implements FallbackOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackOptOutRule): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackOptOutRuleWeightRangeRule implements FallbackOptOutRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackOptOutRule): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback opt out rule. */
export class FallbackOptOutRuleValidator {
  rules: FallbackOptOutRuleRule[];

  constructor(rules: FallbackOptOutRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackOptOutRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackOptOutRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackOptOutRule[]): Map<string, string[]> {
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

export function defaultFallbackOptOutRuleValidator(): FallbackOptOutRuleValidator {
  return new FallbackOptOutRuleValidator(
    [
      new FallbackOptOutRuleAudienceIdLengthRule(16),
      new FallbackOptOutRuleRetriesRangeRule(64, 3600),
      new FallbackOptOutRuleBudgetRangeRule(8.9, 720.4),
      new FallbackOptOutRuleWeightRangeRule(6.3, 789.5),
    ],
  );
}
