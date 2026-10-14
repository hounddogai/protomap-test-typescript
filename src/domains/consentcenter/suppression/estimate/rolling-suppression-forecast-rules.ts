import { RollingSuppressionForecast } from "./rolling-suppression-forecast.js";

/** A rule a rolling suppression forecast must pass. Check returns its problems, or none. */
export interface RollingSuppressionForecastRule {
  check(item: RollingSuppressionForecast): string[];
}

export class RollingSuppressionForecastRequiredCountryRule implements RollingSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSuppressionForecast): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSuppressionForecastCountryLengthRule implements RollingSuppressionForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSuppressionForecast): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSuppressionForecastRequiredLabelRule implements RollingSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSuppressionForecast): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSuppressionForecastRequiredCodeRule implements RollingSuppressionForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSuppressionForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling suppression forecast. */
export class RollingSuppressionForecastValidator {
  rules: RollingSuppressionForecastRule[];

  constructor(rules: RollingSuppressionForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSuppressionForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingSuppressionForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSuppressionForecast[]): Map<string, string[]> {
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

export function defaultRollingSuppressionForecastValidator(): RollingSuppressionForecastValidator {
  return new RollingSuppressionForecastValidator(
    [
      new RollingSuppressionForecastRequiredCountryRule("rolling suppression forecast needs a value"),
      new RollingSuppressionForecastCountryLengthRule(32),
      new RollingSuppressionForecastRequiredLabelRule("rolling suppression forecast needs an entry"),
      new RollingSuppressionForecastRequiredCodeRule("rolling suppression forecast needs a value"),
    ],
  );
}
