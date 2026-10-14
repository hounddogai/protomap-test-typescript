import { TieredTierForecast } from "./tiered-tier-forecast.js";

/** A rule a tiered tier forecast must pass. Check returns its problems, or none. */
export interface TieredTierForecastRule {
  check(item: TieredTierForecast): string[];
}

export class TieredTierForecastRequiredNameRule implements TieredTierForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierForecast): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTierForecastRequiredJourneyIdRule implements TieredTierForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierForecast): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTierForecastCodeLengthRule implements TieredTierForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTierForecast): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTierForecastRequiredCodeRule implements TieredTierForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTierForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTierForecastMinimumRangeRule implements TieredTierForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTierForecast): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered tier forecast. */
export class TieredTierForecastValidator {
  rules: TieredTierForecastRule[];

  constructor(rules: TieredTierForecastRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTierForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTierForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTierForecast[]): Map<string, string[]> {
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

export function defaultTieredTierForecastValidator(): TieredTierForecastValidator {
  return new TieredTierForecastValidator(
    [
      new TieredTierForecastRequiredNameRule("tiered tier forecast needs this field"),
      new TieredTierForecastRequiredJourneyIdRule("tiered tier forecast needs this field"),
      new TieredTierForecastCodeLengthRule(3600),
      new TieredTierForecastRequiredCodeRule("tiered tier forecast needs a value"),
      new TieredTierForecastMinimumRangeRule(2.2, 4802.1),
    ],
  );
}
