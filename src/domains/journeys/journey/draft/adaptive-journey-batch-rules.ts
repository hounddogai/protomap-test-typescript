import { AdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

/** A rule a adaptive journey batch must pass. Check returns its problems, or none. */
export interface AdaptiveJourneyBatchRule {
  check(item: AdaptiveJourneyBatch): string[];
}

export class AdaptiveJourneyBatchDescriptionLengthRule implements AdaptiveJourneyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveJourneyBatch): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveJourneyBatchWeightRangeRule implements AdaptiveJourneyBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveJourneyBatch): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveJourneyBatchRevisionRangeRule implements AdaptiveJourneyBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveJourneyBatch): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive journey batch. */
export class AdaptiveJourneyBatchValidator {
  rules: AdaptiveJourneyBatchRule[];

  constructor(rules: AdaptiveJourneyBatchRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveJourneyBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveJourneyBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveJourneyBatch[]): Map<string, string[]> {
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

export function defaultAdaptiveJourneyBatchValidator(): AdaptiveJourneyBatchValidator {
  return new AdaptiveJourneyBatchValidator(
    [
      new AdaptiveJourneyBatchDescriptionLengthRule(1000),
      new AdaptiveJourneyBatchWeightRangeRule(2.4, 2891.7),
      new AdaptiveJourneyBatchRevisionRangeRule(16, 16),
    ],
  );
}
