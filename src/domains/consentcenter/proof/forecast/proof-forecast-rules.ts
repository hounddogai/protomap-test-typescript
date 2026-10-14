import { ProofForecast } from "./proof-forecast.js";

/** A rule a proof forecast must pass. Check returns its problems, or none. */
export interface ProofForecastRule {
  check(item: ProofForecast): string[];
}

export class ProofForecastLocaleLengthRule implements ProofForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofForecast): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofForecastRequiredLocaleRule implements ProofForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofForecast): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ProofForecastGraceDaysRangeRule implements ProofForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofForecast): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a proof forecast. */
export class ProofForecastValidator {
  rules: ProofForecastRule[];

  constructor(rules: ProofForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ProofForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofForecast[]): Map<string, string[]> {
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

export function defaultProofForecastValidator(): ProofForecastValidator {
  return new ProofForecastValidator(
    [
      new ProofForecastLocaleLengthRule(80),
      new ProofForecastRequiredLocaleRule("proof forecast needs this field"),
      new ProofForecastGraceDaysRangeRule(16, 1000),
    ],
  );
}
