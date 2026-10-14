import { BatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

/** A rule a batched touchpoint preference must pass. Check returns its problems, or none. */
export interface BatchedTouchpointPreferenceRule {
  check(item: BatchedTouchpointPreference): string[];
}

export class BatchedTouchpointPreferenceThresholdRangeRule implements BatchedTouchpointPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTouchpointPreference): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedTouchpointPreferenceStartsAtRangeRule implements BatchedTouchpointPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTouchpointPreference): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTouchpointPreferenceRequiredCodeRule implements BatchedTouchpointPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedTouchpointPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched touchpoint preference. */
export class BatchedTouchpointPreferenceValidator {
  rules: BatchedTouchpointPreferenceRule[];

  constructor(rules: BatchedTouchpointPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTouchpointPreference): string[] {
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

  requireValid(item: BatchedTouchpointPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTouchpointPreference[]): Map<string, string[]> {
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

export function defaultBatchedTouchpointPreferenceValidator(): BatchedTouchpointPreferenceValidator {
  return new BatchedTouchpointPreferenceValidator(
    [
      new BatchedTouchpointPreferenceThresholdRangeRule(0.3, 969.3),
      new BatchedTouchpointPreferenceStartsAtRangeRule(16, 1000),
      new BatchedTouchpointPreferenceRequiredCodeRule("batched touchpoint preference needs a value"),
    ],
  );
}
