import { WeightedWindowRequest } from "./weighted-window-request.js";

/** A rule a weighted window request must pass. Check returns its problems, or none. */
export interface WeightedWindowRequestRule {
  check(item: WeightedWindowRequest): string[];
}

export class WeightedWindowRequestRequiredTitleRule implements WeightedWindowRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedWindowRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedWindowRequestSourceLengthRule implements WeightedWindowRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedWindowRequest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedWindowRequestMinimumRangeRule implements WeightedWindowRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowRequest): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWindowRequestRateRangeRule implements WeightedWindowRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowRequest): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedWindowRequestFrequencyCapRangeRule implements WeightedWindowRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedWindowRequest): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted window request. */
export class WeightedWindowRequestValidator {
  rules: WeightedWindowRequestRule[];

  constructor(rules: WeightedWindowRequestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedWindowRequest): string[] {
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

  requireValid(item: WeightedWindowRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedWindowRequest[]): Map<string, string[]> {
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

export function defaultWeightedWindowRequestValidator(): WeightedWindowRequestValidator {
  return new WeightedWindowRequestValidator(
    [
      new WeightedWindowRequestRequiredTitleRule("weighted window request needs a value"),
      new WeightedWindowRequestSourceLengthRule(120),
      new WeightedWindowRequestMinimumRangeRule(6.9, 4081),
      new WeightedWindowRequestRateRangeRule(2.3, 3080.4),
      new WeightedWindowRequestFrequencyCapRangeRule(86400, 86400),
    ],
  );
}
