import { BatchedPreferenceForecast } from "./batched-preference-forecast.js";

/** A rule a batched preference forecast must pass. Check returns its problems, or none. */
export interface BatchedPreferenceForecastRule {
  check(item: BatchedPreferenceForecast): string[];
}

export class BatchedPreferenceForecastMarginRangeRule implements BatchedPreferenceForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPreferenceForecast): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPreferenceForecastRequiredPhoneRule implements BatchedPreferenceForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPreferenceForecast): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPreferenceForecastPinnedGuardRule implements BatchedPreferenceForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedPreferenceForecast): string[] {
    if (item.pinned && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a batched preference forecast. */
export class BatchedPreferenceForecastValidator {
  rules: BatchedPreferenceForecastRule[];

  constructor(rules: BatchedPreferenceForecastRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPreferenceForecast): string[] {
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

  requireValid(item: BatchedPreferenceForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPreferenceForecast[]): Map<string, string[]> {
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

export function defaultBatchedPreferenceForecastValidator(): BatchedPreferenceForecastValidator {
  return new BatchedPreferenceForecastValidator(
    [
      new BatchedPreferenceForecastMarginRangeRule(3.3, 4501),
      new BatchedPreferenceForecastRequiredPhoneRule("batched preference forecast needs an entry"),
      new BatchedPreferenceForecastPinnedGuardRule(0.4),
    ],
  );
}
