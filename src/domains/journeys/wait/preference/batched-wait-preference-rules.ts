import { BatchedWaitPreference } from "./batched-wait-preference.js";

/** A rule a batched wait preference must pass. Check returns its problems, or none. */
export interface BatchedWaitPreferenceRule {
  check(item: BatchedWaitPreference): string[];
}

export class BatchedWaitPreferenceRequiredCountryRule implements BatchedWaitPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitPreference): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedWaitPreferenceActiveGuardRule implements BatchedWaitPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedWaitPreference): string[] {
    if (item.active && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while active`];
    return [];
  }
}

export class BatchedWaitPreferenceBidRangeRule implements BatchedWaitPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedWaitPreference): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedWaitPreferenceCountryLengthRule implements BatchedWaitPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedWaitPreference): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedWaitPreferenceRequiredTitleRule implements BatchedWaitPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedWaitPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched wait preference. */
export class BatchedWaitPreferenceValidator {
  rules: BatchedWaitPreferenceRule[];

  constructor(rules: BatchedWaitPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedWaitPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedWaitPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedWaitPreference[]): Map<string, string[]> {
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

export function defaultBatchedWaitPreferenceValidator(): BatchedWaitPreferenceValidator {
  return new BatchedWaitPreferenceValidator(
    [
      new BatchedWaitPreferenceRequiredCountryRule("batched wait preference needs a value"),
      new BatchedWaitPreferenceActiveGuardRule(6.5),
      new BatchedWaitPreferenceBidRangeRule(2.8, 103),
      new BatchedWaitPreferenceCountryLengthRule(3600),
      new BatchedWaitPreferenceRequiredTitleRule("batched wait preference needs an entry"),
    ],
  );
}
