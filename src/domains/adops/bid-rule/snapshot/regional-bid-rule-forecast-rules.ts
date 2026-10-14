import { RegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

/** A rule a regional bid rule forecast must pass. Check returns its problems, or none. */
export interface RegionalBidRuleForecastRule {
  check(item: RegionalBidRuleForecast): string[];
}

export class RegionalBidRuleForecastLabelLengthRule implements RegionalBidRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBidRuleForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBidRuleForecastChannelLengthRule implements RegionalBidRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBidRuleForecast): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalBidRuleForecastRetriesRangeRule implements RegionalBidRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalBidRuleForecast): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional bid rule forecast. */
export class RegionalBidRuleForecastValidator {
  rules: RegionalBidRuleForecastRule[];

  constructor(rules: RegionalBidRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBidRuleForecast): string[] {
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

  requireValid(item: RegionalBidRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBidRuleForecast[]): Map<string, string[]> {
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

export function defaultRegionalBidRuleForecastValidator(): RegionalBidRuleForecastValidator {
  return new RegionalBidRuleForecastValidator(
    [
      new RegionalBidRuleForecastLabelLengthRule(86400),
      new RegionalBidRuleForecastChannelLengthRule(1000),
      new RegionalBidRuleForecastRetriesRangeRule(3600, 3600),
    ],
  );
}
