import { WeightedReputationForecast } from "./weighted-reputation-forecast.js";

/** A rule a weighted reputation forecast must pass. Check returns its problems, or none. */
export interface WeightedReputationForecastRule {
  check(item: WeightedReputationForecast): string[];
}

export class WeightedReputationForecastLocaleLengthRule implements WeightedReputationForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationForecast): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationForecastTitleLengthRule implements WeightedReputationForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationForecastCountryLengthRule implements WeightedReputationForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReputationForecast): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReputationForecastRequiredLocaleRule implements WeightedReputationForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReputationForecast): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReputationForecastVersionRangeRule implements WeightedReputationForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedReputationForecast): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted reputation forecast. */
export class WeightedReputationForecastValidator {
  rules: WeightedReputationForecastRule[];

  constructor(rules: WeightedReputationForecastRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReputationForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedReputationForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReputationForecast[]): Map<string, string[]> {
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

export function defaultWeightedReputationForecastValidator(): WeightedReputationForecastValidator {
  return new WeightedReputationForecastValidator(
    [
      new WeightedReputationForecastLocaleLengthRule(255),
      new WeightedReputationForecastTitleLengthRule(3600),
      new WeightedReputationForecastCountryLengthRule(64),
      new WeightedReputationForecastRequiredLocaleRule("weighted reputation forecast needs this field"),
      new WeightedReputationForecastVersionRangeRule(3600, 86400),
    ],
  );
}
