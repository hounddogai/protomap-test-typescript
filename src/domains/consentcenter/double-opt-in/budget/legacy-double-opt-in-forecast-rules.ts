import * as text from "../../../../kit/text.js";
import { LegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

/** A rule a legacy double opt in forecast must pass. Check returns its problems, or none. */
export interface LegacyDoubleOptInForecastRule {
  check(item: LegacyDoubleOptInForecast): string[];
}

export class LegacyDoubleOptInForecastCodePrefixRule implements LegacyDoubleOptInForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyDoubleOptInForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyDoubleOptInForecastThresholdRangeRule implements LegacyDoubleOptInForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDoubleOptInForecast): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyDoubleOptInForecastAllowedExternalRefRule implements LegacyDoubleOptInForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyDoubleOptInForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

/** Runs every rule of a legacy double opt in forecast. */
export class LegacyDoubleOptInForecastValidator {
  rules: LegacyDoubleOptInForecastRule[];

  constructor(rules: LegacyDoubleOptInForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDoubleOptInForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDoubleOptInForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDoubleOptInForecast[]): Map<string, string[]> {
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

export function defaultLegacyDoubleOptInForecastValidator(): LegacyDoubleOptInForecastValidator {
  return new LegacyDoubleOptInForecastValidator(
    [
      new LegacyDoubleOptInForecastCodePrefixRule("ACM"),
      new LegacyDoubleOptInForecastThresholdRangeRule(0.8, 3999.3),
      new LegacyDoubleOptInForecastAllowedExternalRefRule(["rolling", "capped"]),
    ],
  );
}
