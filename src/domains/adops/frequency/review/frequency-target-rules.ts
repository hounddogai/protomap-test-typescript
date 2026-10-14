import { FrequencyTarget } from "./frequency-target.js";

/** A rule a frequency target must pass. Check returns its problems, or none. */
export interface FrequencyTargetRule {
  check(item: FrequencyTarget): string[];
}

export class FrequencyTargetRequiredNameRule implements FrequencyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyTargetRequiredSourceRule implements FrequencyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyTarget): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyTargetConversionRateRangeRule implements FrequencyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyTarget): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency target. */
export class FrequencyTargetValidator {
  rules: FrequencyTargetRule[];

  constructor(rules: FrequencyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyTarget[]): Map<string, string[]> {
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

export function defaultFrequencyTargetValidator(): FrequencyTargetValidator {
  return new FrequencyTargetValidator(
    [
      new FrequencyTargetRequiredNameRule("frequency target needs this field"),
      new FrequencyTargetRequiredSourceRule("frequency target needs a value"),
      new FrequencyTargetConversionRateRangeRule(7.7, 4012.2),
    ],
  );
}
