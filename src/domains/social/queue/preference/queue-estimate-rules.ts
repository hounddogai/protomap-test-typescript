import { QueueEstimate } from "./queue-estimate.js";

/** A rule a queue estimate must pass. Check returns its problems, or none. */
export interface QueueEstimateRule {
  check(item: QueueEstimate): string[];
}

export class QueueEstimateOwnerIdLengthRule implements QueueEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueEstimate): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueEstimateTitleLengthRule implements QueueEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueEstimate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueEstimateExpiresAtRangeRule implements QueueEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueEstimate): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueEstimateCodeLengthRule implements QueueEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueEstimateDescriptionLengthRule implements QueueEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueEstimate): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue estimate. */
export class QueueEstimateValidator {
  rules: QueueEstimateRule[];

  constructor(rules: QueueEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: QueueEstimate): string[] {
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

  requireValid(item: QueueEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueEstimate[]): Map<string, string[]> {
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

export function defaultQueueEstimateValidator(): QueueEstimateValidator {
  return new QueueEstimateValidator(
    [
      new QueueEstimateOwnerIdLengthRule(32),
      new QueueEstimateTitleLengthRule(3600),
      new QueueEstimateExpiresAtRangeRule(120, 255),
      new QueueEstimateCodeLengthRule(255),
      new QueueEstimateDescriptionLengthRule(120),
    ],
  );
}
