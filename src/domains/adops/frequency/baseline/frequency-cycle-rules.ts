import { FrequencyCycle } from "./frequency-cycle.js";

/** A rule a frequency cycle must pass. Check returns its problems, or none. */
export interface FrequencyCycleRule {
  check(item: FrequencyCycle): string[];
}

export class FrequencyCycleSequenceRangeRule implements FrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyCycle): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyCycleRequiredCodeRule implements FrequencyCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyCycleAmountRangeRule implements FrequencyCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyCycle): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a frequency cycle. */
export class FrequencyCycleValidator {
  rules: FrequencyCycleRule[];

  constructor(rules: FrequencyCycleRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyCycle): string[] {
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

  requireValid(item: FrequencyCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyCycle[]): Map<string, string[]> {
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

export function defaultFrequencyCycleValidator(): FrequencyCycleValidator {
  return new FrequencyCycleValidator(
    [
      new FrequencyCycleSequenceRangeRule(16, 120),
      new FrequencyCycleRequiredCodeRule("frequency cycle needs a value"),
      new FrequencyCycleAmountRangeRule(8.9, 2204.1),
    ],
  );
}
