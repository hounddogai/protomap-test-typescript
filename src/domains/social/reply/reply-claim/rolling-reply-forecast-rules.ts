import * as text from "../../../../kit/text.js";
import { RollingReplyForecast } from "./rolling-reply-forecast.js";

/** A rule a rolling reply forecast must pass. Check returns its problems, or none. */
export interface RollingReplyForecastRule {
  check(item: RollingReplyForecast): string[];
}

export class RollingReplyForecastAllowedLocaleRule implements RollingReplyForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingReplyForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is stale`];
    return [];
  }
}

export class RollingReplyForecastScoreRangeRule implements RollingReplyForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingReplyForecast): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingReplyForecastRequiredNameRule implements RollingReplyForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingReplyForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling reply forecast. */
export class RollingReplyForecastValidator {
  rules: RollingReplyForecastRule[];

  constructor(rules: RollingReplyForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RollingReplyForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingReplyForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingReplyForecast[]): Map<string, string[]> {
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

export function defaultRollingReplyForecastValidator(): RollingReplyForecastValidator {
  return new RollingReplyForecastValidator(
    [
      new RollingReplyForecastAllowedLocaleRule(["fallback"]),
      new RollingReplyForecastScoreRangeRule(7.4, 2281.9),
      new RollingReplyForecastRequiredNameRule("rolling reply forecast needs this field"),
    ],
  );
}
