import { SeasonalRewardRuleForecast } from "./seasonal-reward-rule-forecast.js";

/** A rule a seasonal reward rule forecast must pass. Check returns its problems, or none. */
export interface SeasonalRewardRuleForecastRule {
  check(item: SeasonalRewardRuleForecast): string[];
}

export class SeasonalRewardRuleForecastNameLengthRule implements SeasonalRewardRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardRuleForecast): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalRewardRuleForecastRequiredNameRule implements SeasonalRewardRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRewardRuleForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRewardRuleForecastFloorValueRangeRule implements SeasonalRewardRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRewardRuleForecast): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal reward rule forecast. */
export class SeasonalRewardRuleForecastValidator {
  rules: SeasonalRewardRuleForecastRule[];

  constructor(rules: SeasonalRewardRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRewardRuleForecast): string[] {
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

  requireValid(item: SeasonalRewardRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRewardRuleForecast[]): Map<string, string[]> {
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

export function defaultSeasonalRewardRuleForecastValidator(): SeasonalRewardRuleForecastValidator {
  return new SeasonalRewardRuleForecastValidator(
    [
      new SeasonalRewardRuleForecastNameLengthRule(86400),
      new SeasonalRewardRuleForecastRequiredNameRule("seasonal reward rule forecast needs an entry"),
      new SeasonalRewardRuleForecastFloorValueRangeRule(4.8, 1720.7),
    ],
  );
}
