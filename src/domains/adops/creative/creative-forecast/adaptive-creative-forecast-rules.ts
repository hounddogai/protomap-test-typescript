import { AdaptiveCreativeForecast } from "./adaptive-creative-forecast.js";

/** A rule a adaptive creative forecast must pass. Check returns its problems, or none. */
export interface AdaptiveCreativeForecastRule {
  check(item: AdaptiveCreativeForecast): string[];
}

export class AdaptiveCreativeForecastPhoneLengthRule implements AdaptiveCreativeForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreativeForecast): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCreativeForecastCodePrefixRule implements AdaptiveCreativeForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveCreativeForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveCreativeForecastAmountRangeRule implements AdaptiveCreativeForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCreativeForecast): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive creative forecast. */
export class AdaptiveCreativeForecastValidator {
  rules: AdaptiveCreativeForecastRule[];

  constructor(rules: AdaptiveCreativeForecastRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCreativeForecast): string[] {
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

  requireValid(item: AdaptiveCreativeForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCreativeForecast[]): Map<string, string[]> {
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

export function defaultAdaptiveCreativeForecastValidator(): AdaptiveCreativeForecastValidator {
  return new AdaptiveCreativeForecastValidator(
    [
      new AdaptiveCreativeForecastPhoneLengthRule(16),
      new AdaptiveCreativeForecastCodePrefixRule("ACM"),
      new AdaptiveCreativeForecastAmountRangeRule(3.7, 418.7),
    ],
  );
}
