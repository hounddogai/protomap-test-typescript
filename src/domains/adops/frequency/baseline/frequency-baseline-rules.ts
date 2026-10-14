import { FrequencyBaseline } from "./frequency-baseline.js";

/** A rule a frequency baseline must pass. Check returns its problems, or none. */
export interface FrequencyBaselineRule {
  check(item: FrequencyBaseline): string[];
}

export class FrequencyBaselineMaximumRangeRule implements FrequencyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyBaseline): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyBaselineCodePrefixRule implements FrequencyBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyBaselineGraceDaysRangeRule implements FrequencyBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyBaseline): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyBaselineRequiredNameRule implements FrequencyBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency baseline. */
export class FrequencyBaselineValidator {
  rules: FrequencyBaselineRule[];

  constructor(rules: FrequencyBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyBaseline[]): Map<string, string[]> {
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

export function defaultFrequencyBaselineValidator(): FrequencyBaselineValidator {
  return new FrequencyBaselineValidator(
    [
      new FrequencyBaselineMaximumRangeRule(3.7, 4168.3),
      new FrequencyBaselineCodePrefixRule("REF"),
      new FrequencyBaselineGraceDaysRangeRule(16, 1000),
      new FrequencyBaselineRequiredNameRule("frequency baseline needs a value"),
    ],
  );
}
