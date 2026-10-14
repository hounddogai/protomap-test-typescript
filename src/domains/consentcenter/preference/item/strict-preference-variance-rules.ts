import { StrictPreferenceVariance } from "./strict-preference-variance.js";

/** A rule a strict preference variance must pass. Check returns its problems, or none. */
export interface StrictPreferenceVarianceRule {
  check(item: StrictPreferenceVariance): string[];
}

export class StrictPreferenceVarianceDiscountRangeRule implements StrictPreferenceVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPreferenceVariance): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPreferenceVarianceUpdatedAtRangeRule implements StrictPreferenceVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPreferenceVariance): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPreferenceVarianceRequiredOwnerIdRule implements StrictPreferenceVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPreferenceVariance): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict preference variance. */
export class StrictPreferenceVarianceValidator {
  rules: StrictPreferenceVarianceRule[];

  constructor(rules: StrictPreferenceVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPreferenceVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPreferenceVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPreferenceVariance[]): Map<string, string[]> {
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

export function defaultStrictPreferenceVarianceValidator(): StrictPreferenceVarianceValidator {
  return new StrictPreferenceVarianceValidator(
    [
      new StrictPreferenceVarianceDiscountRangeRule(5.2, 1569.8),
      new StrictPreferenceVarianceUpdatedAtRangeRule(120, 255),
      new StrictPreferenceVarianceRequiredOwnerIdRule("strict preference variance needs an entry"),
    ],
  );
}
