import { SeasonalBidRuleForecast } from "./seasonal-bid-rule-forecast.js";

/** A rule a seasonal bid rule forecast must pass. Check returns its problems, or none. */
export interface SeasonalBidRuleForecastRule {
  check(item: SeasonalBidRuleForecast): string[];
}

export class SeasonalBidRuleForecastTitleLengthRule implements SeasonalBidRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalBidRuleForecastRequiredTitleRule implements SeasonalBidRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBidRuleForecastRequiredNameRule implements SeasonalBidRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalBidRuleForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalBidRuleForecastApprovedGuardRule implements SeasonalBidRuleForecastRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalBidRuleForecast): string[] {
    if (item.approved && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class SeasonalBidRuleForecastQuantityRangeRule implements SeasonalBidRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalBidRuleForecast): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalBidRuleForecastCodeLengthRule implements SeasonalBidRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalBidRuleForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal bid rule forecast. */
export class SeasonalBidRuleForecastValidator {
  rules: SeasonalBidRuleForecastRule[];

  constructor(rules: SeasonalBidRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalBidRuleForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalBidRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalBidRuleForecast[]): Map<string, string[]> {
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

export function defaultSeasonalBidRuleForecastValidator(): SeasonalBidRuleForecastValidator {
  return new SeasonalBidRuleForecastValidator(
    [
      new SeasonalBidRuleForecastTitleLengthRule(64),
      new SeasonalBidRuleForecastRequiredTitleRule("seasonal bid rule forecast needs a value"),
      new SeasonalBidRuleForecastRequiredNameRule("seasonal bid rule forecast needs a value"),
      new SeasonalBidRuleForecastApprovedGuardRule(86400),
      new SeasonalBidRuleForecastQuantityRangeRule(64, 80),
      new SeasonalBidRuleForecastCodeLengthRule(1000),
    ],
  );
}
