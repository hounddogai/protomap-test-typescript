import { AdaptiveSuppressionForecast } from "./adaptive-suppression-forecast.js";

/** A rule a adaptive suppression forecast must pass. Check returns its problems, or none. */
export interface AdaptiveSuppressionForecastRule {
  check(item: AdaptiveSuppressionForecast): string[];
}

export class AdaptiveSuppressionForecastRequiredRegionRule implements AdaptiveSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionForecast): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionForecastPriorityRangeRule implements AdaptiveSuppressionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSuppressionForecast): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveSuppressionForecastRequiredCodeRule implements AdaptiveSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionForecastRequiredTitleRule implements AdaptiveSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveSuppressionForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveSuppressionForecastCapacityRangeRule implements AdaptiveSuppressionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSuppressionForecast): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveSuppressionForecastBatchSizeRangeRule implements AdaptiveSuppressionForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveSuppressionForecast): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive suppression forecast. */
export class AdaptiveSuppressionForecastValidator {
  rules: AdaptiveSuppressionForecastRule[];

  constructor(rules: AdaptiveSuppressionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveSuppressionForecast): string[] {
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

  requireValid(item: AdaptiveSuppressionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveSuppressionForecast[]): Map<string, string[]> {
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

export function defaultAdaptiveSuppressionForecastValidator(): AdaptiveSuppressionForecastValidator {
  return new AdaptiveSuppressionForecastValidator(
    [
      new AdaptiveSuppressionForecastRequiredRegionRule("adaptive suppression forecast needs an entry"),
      new AdaptiveSuppressionForecastPriorityRangeRule(16, 80),
      new AdaptiveSuppressionForecastRequiredCodeRule("adaptive suppression forecast needs an entry"),
      new AdaptiveSuppressionForecastRequiredTitleRule("adaptive suppression forecast needs a value"),
      new AdaptiveSuppressionForecastCapacityRangeRule(64, 86400),
      new AdaptiveSuppressionForecastBatchSizeRangeRule(32, 120),
    ],
  );
}
