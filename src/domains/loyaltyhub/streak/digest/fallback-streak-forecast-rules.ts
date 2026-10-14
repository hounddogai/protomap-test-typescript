import * as text from "../../../../kit/text.js";
import { FallbackStreakForecast } from "./fallback-streak-forecast.js";

/** A rule a fallback streak forecast must pass. Check returns its problems, or none. */
export interface FallbackStreakForecastRule {
  check(item: FallbackStreakForecast): string[];
}

export class FallbackStreakForecastDiscountRangeRule implements FallbackStreakForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackStreakForecast): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackStreakForecastCodePrefixRule implements FallbackStreakForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackStreakForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackStreakForecastAllowedTitleRule implements FallbackStreakForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackStreakForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class FallbackStreakForecastRequiredTitleRule implements FallbackStreakForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStreakForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackStreakForecastTitleLengthRule implements FallbackStreakForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackStreakForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackStreakForecastRequiredCodeRule implements FallbackStreakForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackStreakForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback streak forecast. */
export class FallbackStreakForecastValidator {
  rules: FallbackStreakForecastRule[];

  constructor(rules: FallbackStreakForecastRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackStreakForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackStreakForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackStreakForecast[]): Map<string, string[]> {
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

export function defaultFallbackStreakForecastValidator(): FallbackStreakForecastValidator {
  return new FallbackStreakForecastValidator(
    [
      new FallbackStreakForecastDiscountRangeRule(0.2, 766.5),
      new FallbackStreakForecastCodePrefixRule("OPS"),
      new FallbackStreakForecastAllowedTitleRule(["fallback", "pending", "pending"]),
      new FallbackStreakForecastRequiredTitleRule("fallback streak forecast needs a value"),
      new FallbackStreakForecastTitleLengthRule(32),
      new FallbackStreakForecastRequiredCodeRule("fallback streak forecast needs a value"),
    ],
  );
}
