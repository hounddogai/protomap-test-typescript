import { RegionalCohortForecast } from "./regional-cohort-forecast.js";

/** A rule a regional cohort forecast must pass. Check returns its problems, or none. */
export interface RegionalCohortForecastRule {
  check(item: RegionalCohortForecast): string[];
}

export class RegionalCohortForecastRequiredCodeRule implements RegionalCohortForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCohortForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCohortForecastDiscountRangeRule implements RegionalCohortForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCohortForecast): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCohortForecastNameLengthRule implements RegionalCohortForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCohortForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCohortForecastPhoneLengthRule implements RegionalCohortForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCohortForecast): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCohortForecastRequiredContactEmailRule implements RegionalCohortForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCohortForecast): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional cohort forecast. */
export class RegionalCohortForecastValidator {
  rules: RegionalCohortForecastRule[];

  constructor(rules: RegionalCohortForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCohortForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCohortForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCohortForecast[]): Map<string, string[]> {
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

export function defaultRegionalCohortForecastValidator(): RegionalCohortForecastValidator {
  return new RegionalCohortForecastValidator(
    [
      new RegionalCohortForecastRequiredCodeRule("regional cohort forecast needs this field"),
      new RegionalCohortForecastDiscountRangeRule(6, 2412.8),
      new RegionalCohortForecastNameLengthRule(32),
      new RegionalCohortForecastPhoneLengthRule(80),
      new RegionalCohortForecastRequiredContactEmailRule("regional cohort forecast needs an entry"),
    ],
  );
}
