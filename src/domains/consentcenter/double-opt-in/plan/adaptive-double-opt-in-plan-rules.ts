import { AdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

/** A rule a adaptive double opt in plan must pass. Check returns its problems, or none. */
export interface AdaptiveDoubleOptInPlanRule {
  check(item: AdaptiveDoubleOptInPlan): string[];
}

export class AdaptiveDoubleOptInPlanRequiredUtmSourceRule implements AdaptiveDoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDoubleOptInPlan): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDoubleOptInPlanRequiredCodeRule implements AdaptiveDoubleOptInPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDoubleOptInPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDoubleOptInPlanTitleLengthRule implements AdaptiveDoubleOptInPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDoubleOptInPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDoubleOptInPlanGraceDaysRangeRule implements AdaptiveDoubleOptInPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDoubleOptInPlan): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive double opt in plan. */
export class AdaptiveDoubleOptInPlanValidator {
  rules: AdaptiveDoubleOptInPlanRule[];

  constructor(rules: AdaptiveDoubleOptInPlanRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDoubleOptInPlan): string[] {
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

  requireValid(item: AdaptiveDoubleOptInPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDoubleOptInPlan[]): Map<string, string[]> {
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

export function defaultAdaptiveDoubleOptInPlanValidator(): AdaptiveDoubleOptInPlanValidator {
  return new AdaptiveDoubleOptInPlanValidator(
    [
      new AdaptiveDoubleOptInPlanRequiredUtmSourceRule("adaptive double opt in plan needs an entry"),
      new AdaptiveDoubleOptInPlanRequiredCodeRule("adaptive double opt in plan needs a value"),
      new AdaptiveDoubleOptInPlanTitleLengthRule(16),
      new AdaptiveDoubleOptInPlanGraceDaysRangeRule(64, 255),
    ],
  );
}
