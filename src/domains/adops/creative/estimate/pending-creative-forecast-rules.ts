import * as text from "../../../../kit/text.js";
import { PendingCreativeForecast } from "./pending-creative-forecast.js";

/** A rule a pending creative forecast must pass. Check returns its problems, or none. */
export interface PendingCreativeForecastRule {
  check(item: PendingCreativeForecast): string[];
}

export class PendingCreativeForecastAllowedVariantRule implements PendingCreativeForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCreativeForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is below minimum`];
    return [];
  }
}

export class PendingCreativeForecastTitleLengthRule implements PendingCreativeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCreativeForecastVariantLengthRule implements PendingCreativeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeForecast): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCreativeForecastCodePrefixRule implements PendingCreativeForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCreativeForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCreativeForecastCeilingRangeRule implements PendingCreativeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCreativeForecast): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending creative forecast. */
export class PendingCreativeForecastValidator {
  rules: PendingCreativeForecastRule[];

  constructor(rules: PendingCreativeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreativeForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCreativeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreativeForecast[]): Map<string, string[]> {
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

export function defaultPendingCreativeForecastValidator(): PendingCreativeForecastValidator {
  return new PendingCreativeForecastValidator(
    [
      new PendingCreativeForecastAllowedVariantRule(["scheduled"]),
      new PendingCreativeForecastTitleLengthRule(3600),
      new PendingCreativeForecastVariantLengthRule(64),
      new PendingCreativeForecastCodePrefixRule("Q"),
      new PendingCreativeForecastCeilingRangeRule(9.9, 1489),
    ],
  );
}
