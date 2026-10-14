import * as text from "../../../../kit/text.js";
import { RewardForecast } from "./reward-forecast.js";

/** A rule a reward forecast must pass. Check returns its problems, or none. */
export interface RewardForecastRule {
  check(item: RewardForecast): string[];
}

export class RewardForecastJourneyIdLengthRule implements RewardForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardForecast): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardForecastAllowedTitleRule implements RewardForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class RewardForecastTitleLengthRule implements RewardForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward forecast. */
export class RewardForecastValidator {
  rules: RewardForecastRule[];

  constructor(rules: RewardForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RewardForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardForecast[]): Map<string, string[]> {
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

export function defaultRewardForecastValidator(): RewardForecastValidator {
  return new RewardForecastValidator(
    [
      new RewardForecastJourneyIdLengthRule(1000),
      new RewardForecastAllowedTitleRule(["tiered", "pending"]),
      new RewardForecastTitleLengthRule(64),
    ],
  );
}
