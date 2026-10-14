import * as text from "../../../../kit/text.js";
import { AdaptiveModelForecast } from "./adaptive-model-forecast.js";

/** A rule a adaptive model forecast must pass. Check returns its problems, or none. */
export interface AdaptiveModelForecastRule {
  check(item: AdaptiveModelForecast): string[];
}

export class AdaptiveModelForecastRateRangeRule implements AdaptiveModelForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveModelForecast): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveModelForecastRequiredLabelRule implements AdaptiveModelForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveModelForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveModelForecastCodePrefixRule implements AdaptiveModelForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveModelForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveModelForecastAllowedLabelRule implements AdaptiveModelForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveModelForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

/** Runs every rule of a adaptive model forecast. */
export class AdaptiveModelForecastValidator {
  rules: AdaptiveModelForecastRule[];

  constructor(rules: AdaptiveModelForecastRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveModelForecast): string[] {
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

  requireValid(item: AdaptiveModelForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveModelForecast[]): Map<string, string[]> {
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

export function defaultAdaptiveModelForecastValidator(): AdaptiveModelForecastValidator {
  return new AdaptiveModelForecastValidator(
    [
      new AdaptiveModelForecastRateRangeRule(4.7, 1177),
      new AdaptiveModelForecastRequiredLabelRule("adaptive model forecast needs an entry"),
      new AdaptiveModelForecastCodePrefixRule("Q"),
      new AdaptiveModelForecastAllowedLabelRule([]),
    ],
  );
}
