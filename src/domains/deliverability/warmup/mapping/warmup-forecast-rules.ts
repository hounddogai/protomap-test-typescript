import * as text from "../../../../kit/text.js";
import { WarmupForecast } from "./warmup-forecast.js";

/** A rule a warmup forecast must pass. Check returns its problems, or none. */
export interface WarmupForecastRule {
  check(item: WarmupForecast): string[];
}

export class WarmupForecastRequiredLabelRule implements WarmupForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupForecastLabelLengthRule implements WarmupForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupForecastAllowedOwnerIdRule implements WarmupForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is above maximum`];
    return [];
  }
}

export class WarmupForecastPhoneLengthRule implements WarmupForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupForecast): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupForecastRequiredPhoneRule implements WarmupForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupForecast): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupForecastCeilingRangeRule implements WarmupForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupForecast): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a warmup forecast. */
export class WarmupForecastValidator {
  rules: WarmupForecastRule[];

  constructor(rules: WarmupForecastRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupForecast[]): Map<string, string[]> {
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

export function defaultWarmupForecastValidator(): WarmupForecastValidator {
  return new WarmupForecastValidator(
    [
      new WarmupForecastRequiredLabelRule("warmup forecast needs an entry"),
      new WarmupForecastLabelLengthRule(86400),
      new WarmupForecastAllowedOwnerIdRule(["manual", "seasonal"]),
      new WarmupForecastPhoneLengthRule(1000),
      new WarmupForecastRequiredPhoneRule("warmup forecast needs a value"),
      new WarmupForecastCeilingRangeRule(5.4, 882.6),
    ],
  );
}
