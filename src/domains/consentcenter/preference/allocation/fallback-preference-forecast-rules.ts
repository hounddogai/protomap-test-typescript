import { FallbackPreferenceForecast } from "./fallback-preference-forecast.js";

/** A rule a fallback preference forecast must pass. Check returns its problems, or none. */
export interface FallbackPreferenceForecastRule {
  check(item: FallbackPreferenceForecast): string[];
}

export class FallbackPreferenceForecastRetriesRangeRule implements FallbackPreferenceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceForecast): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPreferenceForecastWindowDaysRangeRule implements FallbackPreferenceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceForecast): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPreferenceForecastRequiredCodeRule implements FallbackPreferenceForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPreferenceForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPreferenceForecastQuantityRangeRule implements FallbackPreferenceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceForecast): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPreferenceForecastCodePrefixRule implements FallbackPreferenceForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPreferenceForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback preference forecast. */
export class FallbackPreferenceForecastValidator {
  rules: FallbackPreferenceForecastRule[];

  constructor(rules: FallbackPreferenceForecastRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPreferenceForecast): string[] {
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

  requireValid(item: FallbackPreferenceForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPreferenceForecast[]): Map<string, string[]> {
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

export function defaultFallbackPreferenceForecastValidator(): FallbackPreferenceForecastValidator {
  return new FallbackPreferenceForecastValidator(
    [
      new FallbackPreferenceForecastRetriesRangeRule(32, 1000),
      new FallbackPreferenceForecastWindowDaysRangeRule(120, 86400),
      new FallbackPreferenceForecastRequiredCodeRule("fallback preference forecast needs this field"),
      new FallbackPreferenceForecastQuantityRangeRule(32, 120),
      new FallbackPreferenceForecastCodePrefixRule("X"),
    ],
  );
}
