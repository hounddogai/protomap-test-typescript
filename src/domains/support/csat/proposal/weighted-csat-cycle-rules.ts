import { WeightedCsatCycle } from "./weighted-csat-cycle.js";

/** A rule a weighted csat cycle must pass. Check returns its problems, or none. */
export interface WeightedCsatCycleRule {
  check(item: WeightedCsatCycle): string[];
}

export class WeightedCsatCycleRevisionRangeRule implements WeightedCsatCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedCsatCycle): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WeightedCsatCycleCodePrefixRule implements WeightedCsatCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedCsatCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedCsatCycleRequiredNameRule implements WeightedCsatCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCsatCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedCsatCycleCodeLengthRule implements WeightedCsatCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedCsatCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedCsatCycleRequiredReviewerRule implements WeightedCsatCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedCsatCycle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted csat cycle. */
export class WeightedCsatCycleValidator {
  rules: WeightedCsatCycleRule[];

  constructor(rules: WeightedCsatCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedCsatCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedCsatCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedCsatCycle[]): Map<string, string[]> {
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

export function defaultWeightedCsatCycleValidator(): WeightedCsatCycleValidator {
  return new WeightedCsatCycleValidator(
    [
      new WeightedCsatCycleRevisionRangeRule(32, 64),
      new WeightedCsatCycleCodePrefixRule("REF"),
      new WeightedCsatCycleRequiredNameRule("weighted csat cycle needs an entry"),
      new WeightedCsatCycleCodeLengthRule(1000),
      new WeightedCsatCycleRequiredReviewerRule("weighted csat cycle needs a value"),
    ],
  );
}
