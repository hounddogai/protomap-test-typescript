import { FallbackCohortForecast } from "./fallback-cohort-forecast.js";

/** A rule a fallback cohort forecast must pass. Check returns its problems, or none. */
export interface FallbackCohortForecastRule {
  check(item: FallbackCohortForecast): string[];
}

export class FallbackCohortForecastRequiredCodeRule implements FallbackCohortForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCohortForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCohortForecastVisibleGuardRule implements FallbackCohortForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackCohortForecast): string[] {
    if (item.visible && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class FallbackCohortForecastReviewerLengthRule implements FallbackCohortForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCohortForecast): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCohortForecastRequiredReviewerRule implements FallbackCohortForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCohortForecast): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCohortForecastVariantLengthRule implements FallbackCohortForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCohortForecast): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackCohortForecastPriorityRangeRule implements FallbackCohortForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCohortForecast): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback cohort forecast. */
export class FallbackCohortForecastValidator {
  rules: FallbackCohortForecastRule[];

  constructor(rules: FallbackCohortForecastRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCohortForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackCohortForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCohortForecast[]): Map<string, string[]> {
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

export function defaultFallbackCohortForecastValidator(): FallbackCohortForecastValidator {
  return new FallbackCohortForecastValidator(
    [
      new FallbackCohortForecastRequiredCodeRule("fallback cohort forecast needs this field"),
      new FallbackCohortForecastVisibleGuardRule(4),
      new FallbackCohortForecastReviewerLengthRule(80),
      new FallbackCohortForecastRequiredReviewerRule("fallback cohort forecast needs an entry"),
      new FallbackCohortForecastVariantLengthRule(3600),
      new FallbackCohortForecastPriorityRangeRule(255, 86400),
    ],
  );
}
