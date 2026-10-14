import * as text from "../../../../kit/text.js";
import { LevelForecast } from "./level-forecast.js";

/** A rule a level forecast must pass. Check returns its problems, or none. */
export interface LevelForecastRule {
  check(item: LevelForecast): string[];
}

export class LevelForecastAllowedNotesRule implements LevelForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is duplicated`];
    return [];
  }
}

export class LevelForecastNotesLengthRule implements LevelForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelForecast): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelForecastCurrencyLengthRule implements LevelForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelForecast): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelForecastRequiredCurrencyRule implements LevelForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelForecast): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level forecast. */
export class LevelForecastValidator {
  rules: LevelForecastRule[];

  constructor(rules: LevelForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LevelForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelForecast[]): Map<string, string[]> {
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

export function defaultLevelForecastValidator(): LevelForecastValidator {
  return new LevelForecastValidator(
    [
      new LevelForecastAllowedNotesRule(["scheduled"]),
      new LevelForecastNotesLengthRule(16),
      new LevelForecastCurrencyLengthRule(120),
      new LevelForecastRequiredCurrencyRule("level forecast needs a value"),
    ],
  );
}
