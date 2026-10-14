import * as text from "../../../../kit/text.js";
import { AdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

/** A rule a adaptive touchpoint forecast must pass. Check returns its problems, or none. */
export interface AdaptiveTouchpointForecastRule {
  check(item: AdaptiveTouchpointForecast): string[];
}

export class AdaptiveTouchpointForecastAllowedUnitRule implements AdaptiveTouchpointForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveTouchpointForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is duplicated`];
    return [];
  }
}

export class AdaptiveTouchpointForecastClicksRangeRule implements AdaptiveTouchpointForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveTouchpointForecast): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveTouchpointForecastConversionRateRangeRule implements AdaptiveTouchpointForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveTouchpointForecast): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive touchpoint forecast. */
export class AdaptiveTouchpointForecastValidator {
  rules: AdaptiveTouchpointForecastRule[];

  constructor(rules: AdaptiveTouchpointForecastRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTouchpointForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveTouchpointForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTouchpointForecast[]): Map<string, string[]> {
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

export function defaultAdaptiveTouchpointForecastValidator(): AdaptiveTouchpointForecastValidator {
  return new AdaptiveTouchpointForecastValidator(
    [
      new AdaptiveTouchpointForecastAllowedUnitRule(["strict"]),
      new AdaptiveTouchpointForecastClicksRangeRule(3600, 3600),
      new AdaptiveTouchpointForecastConversionRateRangeRule(3.9, 1082.4),
    ],
  );
}
