import * as text from "../../../../kit/text.js";
import { CreativeForecast } from "./creative-forecast.js";

/** A rule a creative forecast must pass. Check returns its problems, or none. */
export interface CreativeForecastRule {
  check(item: CreativeForecast): string[];
}

export class CreativeForecastApprovedGuardRule implements CreativeForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreativeForecast): string[] {
    if (item.approved && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class CreativeForecastAllowedCodeRule implements CreativeForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class CreativeForecastRequiredJourneyIdRule implements CreativeForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeForecast): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeForecastOpenRateRangeRule implements CreativeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeForecast): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a creative forecast. */
export class CreativeForecastValidator {
  rules: CreativeForecastRule[];

  constructor(rules: CreativeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeForecast): string[] {
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

  requireValid(item: CreativeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeForecast[]): Map<string, string[]> {
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

export function defaultCreativeForecastValidator(): CreativeForecastValidator {
  return new CreativeForecastValidator(
    [
      new CreativeForecastApprovedGuardRule(5.6),
      new CreativeForecastAllowedCodeRule(["rolling", "batched", "manual"]),
      new CreativeForecastRequiredJourneyIdRule("creative forecast needs a value"),
      new CreativeForecastOpenRateRangeRule(3.1, 4820.9),
    ],
  );
}
