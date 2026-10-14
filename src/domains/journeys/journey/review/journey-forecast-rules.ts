import * as text from "../../../../kit/text.js";
import { JourneyForecast } from "./journey-forecast.js";

/** A rule a journey forecast must pass. Check returns its problems, or none. */
export interface JourneyForecastRule {
  check(item: JourneyForecast): string[];
}

export class JourneyForecastRequiredCodeRule implements JourneyForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyForecastAllowedCodeRule implements JourneyForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class JourneyForecastRateRangeRule implements JourneyForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyForecast): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a journey forecast. */
export class JourneyForecastValidator {
  rules: JourneyForecastRule[];

  constructor(rules: JourneyForecastRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyForecast): string[] {
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

  requireValid(item: JourneyForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyForecast[]): Map<string, string[]> {
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

export function defaultJourneyForecastValidator(): JourneyForecastValidator {
  return new JourneyForecastValidator(
    [
      new JourneyForecastRequiredCodeRule("journey forecast needs an entry"),
      new JourneyForecastAllowedCodeRule(["pending", "lenient", "strict"]),
      new JourneyForecastRateRangeRule(8.3, 1579.5),
    ],
  );
}
