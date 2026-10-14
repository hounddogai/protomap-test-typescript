import { LegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

/** A rule a legacy leaderboard forecast must pass. Check returns its problems, or none. */
export interface LegacyLeaderboardForecastRule {
  check(item: LegacyLeaderboardForecast): string[];
}

export class LegacyLeaderboardForecastMarginRangeRule implements LegacyLeaderboardForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyLeaderboardForecast): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyLeaderboardForecastCodePrefixRule implements LegacyLeaderboardForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyLeaderboardForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyLeaderboardForecastUnitLengthRule implements LegacyLeaderboardForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyLeaderboardForecast): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyLeaderboardForecastRequiredUnitRule implements LegacyLeaderboardForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyLeaderboardForecast): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyLeaderboardForecastBatchSizeRangeRule implements LegacyLeaderboardForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyLeaderboardForecast): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy leaderboard forecast. */
export class LegacyLeaderboardForecastValidator {
  rules: LegacyLeaderboardForecastRule[];

  constructor(rules: LegacyLeaderboardForecastRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyLeaderboardForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyLeaderboardForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyLeaderboardForecast[]): Map<string, string[]> {
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

export function defaultLegacyLeaderboardForecastValidator(): LegacyLeaderboardForecastValidator {
  return new LegacyLeaderboardForecastValidator(
    [
      new LegacyLeaderboardForecastMarginRangeRule(8, 434.4),
      new LegacyLeaderboardForecastCodePrefixRule("Q"),
      new LegacyLeaderboardForecastUnitLengthRule(86400),
      new LegacyLeaderboardForecastRequiredUnitRule("legacy leaderboard forecast needs an entry"),
      new LegacyLeaderboardForecastBatchSizeRangeRule(32, 32),
    ],
  );
}
