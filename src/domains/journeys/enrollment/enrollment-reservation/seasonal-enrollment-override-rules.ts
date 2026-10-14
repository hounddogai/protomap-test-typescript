import { SeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

/** A rule a seasonal enrollment override must pass. Check returns its problems, or none. */
export interface SeasonalEnrollmentOverrideRule {
  check(item: SeasonalEnrollmentOverride): string[];
}

export class SeasonalEnrollmentOverrideArchivedGuardRule implements SeasonalEnrollmentOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalEnrollmentOverride): string[] {
    if (item.archived && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class SeasonalEnrollmentOverrideCodeLengthRule implements SeasonalEnrollmentOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEnrollmentOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEnrollmentOverrideMinimumRangeRule implements SeasonalEnrollmentOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalEnrollmentOverride): string[] {
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

/** Runs every rule of a seasonal enrollment override. */
export class SeasonalEnrollmentOverrideValidator {
  rules: SeasonalEnrollmentOverrideRule[];

  constructor(rules: SeasonalEnrollmentOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEnrollmentOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalEnrollmentOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEnrollmentOverride[]): Map<string, string[]> {
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

export function defaultSeasonalEnrollmentOverrideValidator(): SeasonalEnrollmentOverrideValidator {
  return new SeasonalEnrollmentOverrideValidator(
    [
      new SeasonalEnrollmentOverrideArchivedGuardRule(0.3),
      new SeasonalEnrollmentOverrideCodeLengthRule(120),
      new SeasonalEnrollmentOverrideMinimumRangeRule(4, 274.5),
    ],
  );
}
