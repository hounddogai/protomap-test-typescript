import { JourneyBatch } from "./journey-batch.js";

/** A rule a journey batch must pass. Check returns its problems, or none. */
export interface JourneyBatchRule {
  check(item: JourneyBatch): string[];
}

export class JourneyBatchVersionRangeRule implements JourneyBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyBatch): string[] {
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

export class JourneyBatchDescriptionLengthRule implements JourneyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyBatch): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyBatchChannelLengthRule implements JourneyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyBatch): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey batch. */
export class JourneyBatchValidator {
  rules: JourneyBatchRule[];

  constructor(rules: JourneyBatchRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyBatch): string[] {
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

  requireValid(item: JourneyBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyBatch[]): Map<string, string[]> {
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

export function defaultJourneyBatchValidator(): JourneyBatchValidator {
  return new JourneyBatchValidator(
    [
      new JourneyBatchVersionRangeRule(1000, 86400),
      new JourneyBatchDescriptionLengthRule(16),
      new JourneyBatchChannelLengthRule(1000),
    ],
  );
}
