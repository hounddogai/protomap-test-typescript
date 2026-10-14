import { EnrollmentForecast } from "./enrollment-forecast.js";

/** A rule a enrollment forecast must pass. Check returns its problems, or none. */
export interface EnrollmentForecastRule {
  check(item: EnrollmentForecast): string[];
}

export class EnrollmentForecastFloorValueRangeRule implements EnrollmentForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentForecast): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentForecastCodeLengthRule implements EnrollmentForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentForecastCodePrefixRule implements EnrollmentForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a enrollment forecast. */
export class EnrollmentForecastValidator {
  rules: EnrollmentForecastRule[];

  constructor(rules: EnrollmentForecastRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentForecast): string[] {
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

  requireValid(item: EnrollmentForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentForecast[]): Map<string, string[]> {
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

export function defaultEnrollmentForecastValidator(): EnrollmentForecastValidator {
  return new EnrollmentForecastValidator(
    [
      new EnrollmentForecastFloorValueRangeRule(7.8, 1552.2),
      new EnrollmentForecastCodeLengthRule(120),
      new EnrollmentForecastCodePrefixRule("REF"),
    ],
  );
}
