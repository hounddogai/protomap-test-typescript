import { BounceForecast } from "./bounce-forecast.js";

/** A rule a bounce forecast must pass. Check returns its problems, or none. */
export interface BounceForecastRule {
  check(item: BounceForecast): string[];
}

export class BounceForecastArchivedGuardRule implements BounceForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BounceForecast): string[] {
    if (item.archived && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class BounceForecastDurationMinutesRangeRule implements BounceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceForecast): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BounceForecastRequiredNotesRule implements BounceForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceForecast): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce forecast. */
export class BounceForecastValidator {
  rules: BounceForecastRule[];

  constructor(rules: BounceForecastRule[]) {
    this.rules = rules;
  }

  validate(item: BounceForecast): string[] {
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

  requireValid(item: BounceForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceForecast[]): Map<string, string[]> {
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

export function defaultBounceForecastValidator(): BounceForecastValidator {
  return new BounceForecastValidator(
    [
      new BounceForecastArchivedGuardRule(16),
      new BounceForecastDurationMinutesRangeRule(255, 86400),
      new BounceForecastRequiredNotesRule("bounce forecast needs this field"),
    ],
  );
}
