import * as text from "../../../../kit/text.js";
import { BidRuleForecast } from "./bid-rule-forecast.js";

/** A rule a bid rule forecast must pass. Check returns its problems, or none. */
export interface BidRuleForecastRule {
  check(item: BidRuleForecast): string[];
}

export class BidRuleForecastRequiredCodeRule implements BidRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleForecastAllowedCodeRule implements BidRuleForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class BidRuleForecastMarginRangeRule implements BidRuleForecastRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleForecast): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bid rule forecast. */
export class BidRuleForecastValidator {
  rules: BidRuleForecastRule[];

  constructor(rules: BidRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleForecast[]): Map<string, string[]> {
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

export function defaultBidRuleForecastValidator(): BidRuleForecastValidator {
  return new BidRuleForecastValidator(
    [
      new BidRuleForecastRequiredCodeRule("bid rule forecast needs this field"),
      new BidRuleForecastAllowedCodeRule(["adaptive"]),
      new BidRuleForecastMarginRangeRule(9.4, 1496),
    ],
  );
}
