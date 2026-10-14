import { SeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

/** A rule a seasonal double opt in batch must pass. Check returns its problems, or none. */
export interface SeasonalDoubleOptInBatchRule {
  check(item: SeasonalDoubleOptInBatch): string[];
}

export class SeasonalDoubleOptInBatchCreatedAtRangeRule implements SeasonalDoubleOptInBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDoubleOptInBatch): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalDoubleOptInBatchCodePrefixRule implements SeasonalDoubleOptInBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalDoubleOptInBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalDoubleOptInBatchCohortLengthRule implements SeasonalDoubleOptInBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDoubleOptInBatch): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDoubleOptInBatchBudgetRangeRule implements SeasonalDoubleOptInBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDoubleOptInBatch): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalDoubleOptInBatchRetriesRangeRule implements SeasonalDoubleOptInBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDoubleOptInBatch): string[] {
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

/** Runs every rule of a seasonal double opt in batch. */
export class SeasonalDoubleOptInBatchValidator {
  rules: SeasonalDoubleOptInBatchRule[];

  constructor(rules: SeasonalDoubleOptInBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDoubleOptInBatch): string[] {
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

  requireValid(item: SeasonalDoubleOptInBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDoubleOptInBatch[]): Map<string, string[]> {
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

export function defaultSeasonalDoubleOptInBatchValidator(): SeasonalDoubleOptInBatchValidator {
  return new SeasonalDoubleOptInBatchValidator(
    [
      new SeasonalDoubleOptInBatchCreatedAtRangeRule(80, 255),
      new SeasonalDoubleOptInBatchCodePrefixRule("REF"),
      new SeasonalDoubleOptInBatchCohortLengthRule(1000),
      new SeasonalDoubleOptInBatchBudgetRangeRule(0.9, 2266.9),
      new SeasonalDoubleOptInBatchRetriesRangeRule(64, 255),
    ],
  );
}
