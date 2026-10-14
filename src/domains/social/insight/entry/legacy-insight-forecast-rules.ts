import * as text from "../../../../kit/text.js";
import { LegacyInsightForecast } from "./legacy-insight-forecast.js";

/** A rule a legacy insight forecast must pass. Check returns its problems, or none. */
export interface LegacyInsightForecastRule {
  check(item: LegacyInsightForecast): string[];
}

export class LegacyInsightForecastCodeLengthRule implements LegacyInsightForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInsightForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyInsightForecastAllowedCountryRule implements LegacyInsightForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyInsightForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is below minimum`];
    return [];
  }
}

export class LegacyInsightForecastRequiredLocaleRule implements LegacyInsightForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyInsightForecast): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyInsightForecastCategoryLengthRule implements LegacyInsightForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyInsightForecast): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyInsightForecastCodePrefixRule implements LegacyInsightForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyInsightForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a legacy insight forecast. */
export class LegacyInsightForecastValidator {
  rules: LegacyInsightForecastRule[];

  constructor(rules: LegacyInsightForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyInsightForecast): string[] {
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

  requireValid(item: LegacyInsightForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyInsightForecast[]): Map<string, string[]> {
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

export function defaultLegacyInsightForecastValidator(): LegacyInsightForecastValidator {
  return new LegacyInsightForecastValidator(
    [
      new LegacyInsightForecastCodeLengthRule(120),
      new LegacyInsightForecastAllowedCountryRule(["legacy", "fallback"]),
      new LegacyInsightForecastRequiredLocaleRule("legacy insight forecast needs an entry"),
      new LegacyInsightForecastCategoryLengthRule(80),
      new LegacyInsightForecastCodePrefixRule("OPS"),
    ],
  );
}
