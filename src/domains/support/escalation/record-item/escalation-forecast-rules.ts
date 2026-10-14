import * as text from "../../../../kit/text.js";
import { EscalationForecast } from "./escalation-forecast.js";

/** A rule a escalation forecast must pass. Check returns its problems, or none. */
export interface EscalationForecastRule {
  check(item: EscalationForecast): string[];
}

export class EscalationForecastRequiredCodeRule implements EscalationForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationForecastUpdatedAtRangeRule implements EscalationForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationForecast): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationForecastRequiredCountryRule implements EscalationForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationForecast): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationForecastAllowedLabelRule implements EscalationForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class EscalationForecastCodeLengthRule implements EscalationForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationForecastRequiredLabelRule implements EscalationForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation forecast. */
export class EscalationForecastValidator {
  rules: EscalationForecastRule[];

  constructor(rules: EscalationForecastRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationForecast[]): Map<string, string[]> {
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

export function defaultEscalationForecastValidator(): EscalationForecastValidator {
  return new EscalationForecastValidator(
    [
      new EscalationForecastRequiredCodeRule("escalation forecast needs a value"),
      new EscalationForecastUpdatedAtRangeRule(80, 255),
      new EscalationForecastRequiredCountryRule("escalation forecast needs this field"),
      new EscalationForecastAllowedLabelRule([]),
      new EscalationForecastCodeLengthRule(3600),
      new EscalationForecastRequiredLabelRule("escalation forecast needs a value"),
    ],
  );
}
