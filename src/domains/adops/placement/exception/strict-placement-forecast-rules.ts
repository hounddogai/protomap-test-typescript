import { StrictPlacementForecast } from "./strict-placement-forecast.js";

/** A rule a strict placement forecast must pass. Check returns its problems, or none. */
export interface StrictPlacementForecastRule {
  check(item: StrictPlacementForecast): string[];
}

export class StrictPlacementForecastCodePrefixRule implements StrictPlacementForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPlacementForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPlacementForecastCodeLengthRule implements StrictPlacementForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPlacementForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPlacementForecastUpdatedAtRangeRule implements StrictPlacementForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPlacementForecast): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict placement forecast. */
export class StrictPlacementForecastValidator {
  rules: StrictPlacementForecastRule[];

  constructor(rules: StrictPlacementForecastRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPlacementForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPlacementForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPlacementForecast[]): Map<string, string[]> {
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

export function defaultStrictPlacementForecastValidator(): StrictPlacementForecastValidator {
  return new StrictPlacementForecastValidator(
    [
      new StrictPlacementForecastCodePrefixRule("ACM"),
      new StrictPlacementForecastCodeLengthRule(32),
      new StrictPlacementForecastUpdatedAtRangeRule(64, 80),
    ],
  );
}
