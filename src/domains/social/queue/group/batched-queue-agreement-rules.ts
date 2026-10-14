import { BatchedQueueAgreement } from "./batched-queue-agreement.js";

/** A rule a batched queue agreement must pass. Check returns its problems, or none. */
export interface BatchedQueueAgreementRule {
  check(item: BatchedQueueAgreement): string[];
}

export class BatchedQueueAgreementWeightRangeRule implements BatchedQueueAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedQueueAgreement): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedQueueAgreementCodePrefixRule implements BatchedQueueAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedQueueAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedQueueAgreementNameLengthRule implements BatchedQueueAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedQueueAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedQueueAgreementWindowDaysRangeRule implements BatchedQueueAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedQueueAgreement): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedQueueAgreementCodeLengthRule implements BatchedQueueAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedQueueAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedQueueAgreementUpdatedAtRangeRule implements BatchedQueueAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedQueueAgreement): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a batched queue agreement. */
export class BatchedQueueAgreementValidator {
  rules: BatchedQueueAgreementRule[];

  constructor(rules: BatchedQueueAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedQueueAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedQueueAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedQueueAgreement[]): Map<string, string[]> {
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

export function defaultBatchedQueueAgreementValidator(): BatchedQueueAgreementValidator {
  return new BatchedQueueAgreementValidator(
    [
      new BatchedQueueAgreementWeightRangeRule(4, 2336.4),
      new BatchedQueueAgreementCodePrefixRule("ACM"),
      new BatchedQueueAgreementNameLengthRule(80),
      new BatchedQueueAgreementWindowDaysRangeRule(32, 80),
      new BatchedQueueAgreementCodeLengthRule(16),
      new BatchedQueueAgreementUpdatedAtRangeRule(16, 86400),
    ],
  );
}
