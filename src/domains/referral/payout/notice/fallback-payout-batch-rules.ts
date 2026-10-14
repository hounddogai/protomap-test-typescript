import { FallbackPayoutBatch } from "./fallback-payout-batch.js";

/** A rule a fallback payout batch must pass. Check returns its problems, or none. */
export interface FallbackPayoutBatchRule {
  check(item: FallbackPayoutBatch): string[];
}

export class FallbackPayoutBatchRetriesRangeRule implements FallbackPayoutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutBatch): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPayoutBatchVersionRangeRule implements FallbackPayoutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutBatch): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPayoutBatchRequiredTimezoneRule implements FallbackPayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPayoutBatch): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPayoutBatchSequenceRangeRule implements FallbackPayoutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutBatch): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback payout batch. */
export class FallbackPayoutBatchValidator {
  rules: FallbackPayoutBatchRule[];

  constructor(rules: FallbackPayoutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPayoutBatch): string[] {
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

  requireValid(item: FallbackPayoutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPayoutBatch[]): Map<string, string[]> {
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

export function defaultFallbackPayoutBatchValidator(): FallbackPayoutBatchValidator {
  return new FallbackPayoutBatchValidator(
    [
      new FallbackPayoutBatchRetriesRangeRule(1000, 3600),
      new FallbackPayoutBatchVersionRangeRule(64, 3600),
      new FallbackPayoutBatchRequiredTimezoneRule("fallback payout batch needs an entry"),
      new FallbackPayoutBatchSequenceRangeRule(64, 255),
    ],
  );
}
