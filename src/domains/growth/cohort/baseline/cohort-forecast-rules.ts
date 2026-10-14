import * as text from "../../../../kit/text.js";
import { CohortForecast } from "./cohort-forecast.js";

/** A rule a cohort forecast must pass. Check returns its problems, or none. */
export interface CohortForecastRule {
  check(item: CohortForecast): string[];
}

export class CohortForecastAllowedChecksumRule implements CohortForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is not allowed`];
    return [];
  }
}

export class CohortForecastChecksumLengthRule implements CohortForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortForecast): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortForecastDurationMinutesRangeRule implements CohortForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortForecast): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortForecastRequiredNameRule implements CohortForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortForecastRequiredRegionRule implements CohortForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortForecast): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort forecast. */
export class CohortForecastValidator {
  rules: CohortForecastRule[];

  constructor(rules: CohortForecastRule[]) {
    this.rules = rules;
  }

  validate(item: CohortForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortForecast[]): Map<string, string[]> {
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

export function defaultCohortForecastValidator(): CohortForecastValidator {
  return new CohortForecastValidator(
    [
      new CohortForecastAllowedChecksumRule(["scheduled"]),
      new CohortForecastChecksumLengthRule(80),
      new CohortForecastDurationMinutesRangeRule(1000, 86400),
      new CohortForecastRequiredNameRule("cohort forecast needs an entry"),
      new CohortForecastRequiredRegionRule("cohort forecast needs an entry"),
    ],
  );
}
