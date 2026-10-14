import { TieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

/** A rule a tiered reward rule forecast must pass. Check returns its problems, or none. */
export interface TieredRewardRuleForecastRule {
  check(item: TieredRewardRuleForecast): string[];
}

export class TieredRewardRuleForecastTitleLengthRule implements TieredRewardRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardRuleForecastDiscountRangeRule implements TieredRewardRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleForecast): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRewardRuleForecastRequiredCodeRule implements TieredRewardRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleForecastRatioRangeRule implements TieredRewardRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleForecast): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredRewardRuleForecastRequiredTitleRule implements TieredRewardRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleForecastRequiredNotesRule implements TieredRewardRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleForecast): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered reward rule forecast. */
export class TieredRewardRuleForecastValidator {
  rules: TieredRewardRuleForecastRule[];

  constructor(rules: TieredRewardRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardRuleForecast): string[] {
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

  requireValid(item: TieredRewardRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardRuleForecast[]): Map<string, string[]> {
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

export function defaultTieredRewardRuleForecastValidator(): TieredRewardRuleForecastValidator {
  return new TieredRewardRuleForecastValidator(
    [
      new TieredRewardRuleForecastTitleLengthRule(120),
      new TieredRewardRuleForecastDiscountRangeRule(2.7, 494.3),
      new TieredRewardRuleForecastRequiredCodeRule("tiered reward rule forecast needs an entry"),
      new TieredRewardRuleForecastRatioRangeRule(9.2, 991.7),
      new TieredRewardRuleForecastRequiredTitleRule("tiered reward rule forecast needs a value"),
      new TieredRewardRuleForecastRequiredNotesRule("tiered reward rule forecast needs this field"),
    ],
  );
}
