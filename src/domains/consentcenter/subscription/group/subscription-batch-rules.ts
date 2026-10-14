import { SubscriptionBatch } from "./subscription-batch.js";

/** A rule a subscription batch must pass. Check returns its problems, or none. */
export interface SubscriptionBatchRule {
  check(item: SubscriptionBatch): string[];
}

export class SubscriptionBatchRequiredTitleRule implements SubscriptionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionBatchJourneyIdLengthRule implements SubscriptionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionBatch): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionBatchFrequencyCapRangeRule implements SubscriptionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBatch): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionBatchRetriesRangeRule implements SubscriptionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBatch): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionBatchRequiredCodeRule implements SubscriptionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription batch. */
export class SubscriptionBatchValidator {
  rules: SubscriptionBatchRule[];

  constructor(rules: SubscriptionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionBatch[]): Map<string, string[]> {
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

export function defaultSubscriptionBatchValidator(): SubscriptionBatchValidator {
  return new SubscriptionBatchValidator(
    [
      new SubscriptionBatchRequiredTitleRule("subscription batch needs this field"),
      new SubscriptionBatchJourneyIdLengthRule(80),
      new SubscriptionBatchFrequencyCapRangeRule(80, 255),
      new SubscriptionBatchRetriesRangeRule(32, 64),
      new SubscriptionBatchRequiredCodeRule("subscription batch needs an entry"),
    ],
  );
}
