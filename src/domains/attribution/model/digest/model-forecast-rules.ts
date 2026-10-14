import { ModelForecast } from "./model-forecast.js";

/** A rule a model forecast must pass. Check returns its problems, or none. */
export interface ModelForecastRule {
  check(item: ModelForecast): string[];
}

export class ModelForecastNameLengthRule implements ModelForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelForecastRequiredAudienceIdRule implements ModelForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelForecast): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ModelForecastDurationMinutesRangeRule implements ModelForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelForecast): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a model forecast. */
export class ModelForecastValidator {
  rules: ModelForecastRule[];

  constructor(rules: ModelForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ModelForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelForecast[]): Map<string, string[]> {
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

export function defaultModelForecastValidator(): ModelForecastValidator {
  return new ModelForecastValidator(
    [
      new ModelForecastNameLengthRule(80),
      new ModelForecastRequiredAudienceIdRule("model forecast needs a value"),
      new ModelForecastDurationMinutesRangeRule(16, 64),
    ],
  );
}
