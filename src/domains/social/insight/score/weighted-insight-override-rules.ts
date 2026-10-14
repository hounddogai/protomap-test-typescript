import { WeightedInsightOverride } from "./weighted-insight-override.js";

/** A rule a weighted insight override must pass. Check returns its problems, or none. */
export interface WeightedInsightOverrideRule {
  check(item: WeightedInsightOverride): string[];
}

export class WeightedInsightOverrideCountryLengthRule implements WeightedInsightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightOverride): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightOverrideRequiredSourceRule implements WeightedInsightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightOverride): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedInsightOverrideSourceLengthRule implements WeightedInsightOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedInsightOverride): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedInsightOverrideCostRangeRule implements WeightedInsightOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedInsightOverride): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedInsightOverrideRequiredLabelRule implements WeightedInsightOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedInsightOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted insight override. */
export class WeightedInsightOverrideValidator {
  rules: WeightedInsightOverrideRule[];

  constructor(rules: WeightedInsightOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedInsightOverride): string[] {
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

  requireValid(item: WeightedInsightOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedInsightOverride[]): Map<string, string[]> {
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

export function defaultWeightedInsightOverrideValidator(): WeightedInsightOverrideValidator {
  return new WeightedInsightOverrideValidator(
    [
      new WeightedInsightOverrideCountryLengthRule(32),
      new WeightedInsightOverrideRequiredSourceRule("weighted insight override needs a value"),
      new WeightedInsightOverrideSourceLengthRule(120),
      new WeightedInsightOverrideCostRangeRule(9.9, 291.2),
      new WeightedInsightOverrideRequiredLabelRule("weighted insight override needs a value"),
    ],
  );
}
