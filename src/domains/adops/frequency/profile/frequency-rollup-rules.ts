import { FrequencyRollup } from "./frequency-rollup.js";

/** A rule a frequency rollup must pass. Check returns its problems, or none. */
export interface FrequencyRollupRule {
  check(item: FrequencyRollup): string[];
}

export class FrequencyRollupTimezoneLengthRule implements FrequencyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyRollup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyRollupCodePrefixRule implements FrequencyRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyRollupFrequencyCapRangeRule implements FrequencyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyRollup): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyRollupRequiredTimezoneRule implements FrequencyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyRollup): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyRollupStartsAtRangeRule implements FrequencyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyRollup): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency rollup. */
export class FrequencyRollupValidator {
  rules: FrequencyRollupRule[];

  constructor(rules: FrequencyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyRollup[]): Map<string, string[]> {
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

export function defaultFrequencyRollupValidator(): FrequencyRollupValidator {
  return new FrequencyRollupValidator(
    [
      new FrequencyRollupTimezoneLengthRule(3600),
      new FrequencyRollupCodePrefixRule("X"),
      new FrequencyRollupFrequencyCapRangeRule(64, 255),
      new FrequencyRollupRequiredTimezoneRule("frequency rollup needs this field"),
      new FrequencyRollupStartsAtRangeRule(1000, 3600),
    ],
  );
}
