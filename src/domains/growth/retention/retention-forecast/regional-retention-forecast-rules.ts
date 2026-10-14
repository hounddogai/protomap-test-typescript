import { RegionalRetentionForecast } from "./regional-retention-forecast.js";

/** A rule a regional retention forecast must pass. Check returns its problems, or none. */
export interface RegionalRetentionForecastRule {
  check(item: RegionalRetentionForecast): string[];
}

export class RegionalRetentionForecastContactEmailLengthRule implements RegionalRetentionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRetentionForecast): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRetentionForecastRequiredContactEmailRule implements RegionalRetentionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRetentionForecast): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRetentionForecastWeightRangeRule implements RegionalRetentionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalRetentionForecast): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional retention forecast. */
export class RegionalRetentionForecastValidator {
  rules: RegionalRetentionForecastRule[];

  constructor(rules: RegionalRetentionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRetentionForecast): string[] {
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

  requireValid(item: RegionalRetentionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRetentionForecast[]): Map<string, string[]> {
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

export function defaultRegionalRetentionForecastValidator(): RegionalRetentionForecastValidator {
  return new RegionalRetentionForecastValidator(
    [
      new RegionalRetentionForecastContactEmailLengthRule(1000),
      new RegionalRetentionForecastRequiredContactEmailRule("regional retention forecast needs a value"),
      new RegionalRetentionForecastWeightRangeRule(7, 2829.1),
    ],
  );
}
