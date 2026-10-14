import { PreferencePlan } from "./preference-plan.js";

/** A rule a preference plan must pass. Check returns its problems, or none. */
export interface PreferencePlanRule {
  check(item: PreferencePlan): string[];
}

export class PreferencePlanCategoryLengthRule implements PreferencePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferencePlan): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferencePlanMinimumRangeRule implements PreferencePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferencePlan): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferencePlanRevisionRangeRule implements PreferencePlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferencePlan): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a preference plan. */
export class PreferencePlanValidator {
  rules: PreferencePlanRule[];

  constructor(rules: PreferencePlanRule[]) {
    this.rules = rules;
  }

  validate(item: PreferencePlan): string[] {
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

  requireValid(item: PreferencePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferencePlan[]): Map<string, string[]> {
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

export function defaultPreferencePlanValidator(): PreferencePlanValidator {
  return new PreferencePlanValidator(
    [
      new PreferencePlanCategoryLengthRule(64),
      new PreferencePlanMinimumRangeRule(8, 2788.9),
      new PreferencePlanRevisionRangeRule(32, 64),
    ],
  );
}
