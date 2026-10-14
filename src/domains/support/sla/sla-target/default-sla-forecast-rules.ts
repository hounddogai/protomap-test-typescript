import * as text from "../../../../kit/text.js";
import { DefaultSlaForecast } from "./default-sla-forecast.js";

/** A rule a default sla forecast must pass. Check returns its problems, or none. */
export interface DefaultSlaForecastRule {
  check(item: DefaultSlaForecast): string[];
}

export class DefaultSlaForecastCodePrefixRule implements DefaultSlaForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultSlaForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultSlaForecastScoreRangeRule implements DefaultSlaForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSlaForecast): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultSlaForecastAllowedLabelRule implements DefaultSlaForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultSlaForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class DefaultSlaForecastRequiredLabelRule implements DefaultSlaForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultSlaForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default sla forecast. */
export class DefaultSlaForecastValidator {
  rules: DefaultSlaForecastRule[];

  constructor(rules: DefaultSlaForecastRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSlaForecast): string[] {
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

  requireValid(item: DefaultSlaForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSlaForecast[]): Map<string, string[]> {
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

export function defaultDefaultSlaForecastValidator(): DefaultSlaForecastValidator {
  return new DefaultSlaForecastValidator(
    [
      new DefaultSlaForecastCodePrefixRule("OPS"),
      new DefaultSlaForecastScoreRangeRule(2.7, 1577.2),
      new DefaultSlaForecastAllowedLabelRule(["fallback", "rolling"]),
      new DefaultSlaForecastRequiredLabelRule("default sla forecast needs an entry"),
    ],
  );
}
