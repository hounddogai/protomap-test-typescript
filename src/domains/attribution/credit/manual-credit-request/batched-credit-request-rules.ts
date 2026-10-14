import { BatchedCreditRequest } from "./batched-credit-request.js";

/** A rule a batched credit request must pass. Check returns its problems, or none. */
export interface BatchedCreditRequestRule {
  check(item: BatchedCreditRequest): string[];
}

export class BatchedCreditRequestRequiredNameRule implements BatchedCreditRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreditRequestCodeLengthRule implements BatchedCreditRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedCreditRequestClicksRangeRule implements BatchedCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditRequest): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedCreditRequestStartsAtRangeRule implements BatchedCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditRequest): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedCreditRequestGraceDaysRangeRule implements BatchedCreditRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedCreditRequest): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedCreditRequestCodePrefixRule implements BatchedCreditRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedCreditRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched credit request. */
export class BatchedCreditRequestValidator {
  rules: BatchedCreditRequestRule[];

  constructor(rules: BatchedCreditRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreditRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedCreditRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreditRequest[]): Map<string, string[]> {
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

export function defaultBatchedCreditRequestValidator(): BatchedCreditRequestValidator {
  return new BatchedCreditRequestValidator(
    [
      new BatchedCreditRequestRequiredNameRule("batched credit request needs an entry"),
      new BatchedCreditRequestCodeLengthRule(80),
      new BatchedCreditRequestClicksRangeRule(64, 120),
      new BatchedCreditRequestStartsAtRangeRule(255, 3600),
      new BatchedCreditRequestGraceDaysRangeRule(32, 255),
      new BatchedCreditRequestCodePrefixRule("OPS"),
    ],
  );
}
