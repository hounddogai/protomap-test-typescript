import { LegacyStepForecast } from "./legacy-step-forecast.js";

/** A rule a legacy step forecast must pass. Check returns its problems, or none. */
export interface LegacyStepForecastRule {
  check(item: LegacyStepForecast): string[];
}

export class LegacyStepForecastReviewerLengthRule implements LegacyStepForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyStepForecast): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyStepForecastActiveGuardRule implements LegacyStepForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyStepForecast): string[] {
    if (item.active && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while active`];
    return [];
  }
}

export class LegacyStepForecastRequiredCodeRule implements LegacyStepForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStepForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyStepForecastScoreRangeRule implements LegacyStepForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyStepForecast): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy step forecast. */
export class LegacyStepForecastValidator {
  rules: LegacyStepForecastRule[];

  constructor(rules: LegacyStepForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyStepForecast): string[] {
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

  requireValid(item: LegacyStepForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyStepForecast[]): Map<string, string[]> {
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

export function defaultLegacyStepForecastValidator(): LegacyStepForecastValidator {
  return new LegacyStepForecastValidator(
    [
      new LegacyStepForecastReviewerLengthRule(86400),
      new LegacyStepForecastActiveGuardRule(3.3),
      new LegacyStepForecastRequiredCodeRule("legacy step forecast needs this field"),
      new LegacyStepForecastScoreRangeRule(8.5, 4936.1),
    ],
  );
}
