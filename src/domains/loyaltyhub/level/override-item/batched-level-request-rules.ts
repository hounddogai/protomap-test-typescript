import { BatchedLevelRequest } from "./batched-level-request.js";

/** A rule a batched level request must pass. Check returns its problems, or none. */
export interface BatchedLevelRequestRule {
  check(item: BatchedLevelRequest): string[];
}

export class BatchedLevelRequestRequiredTitleRule implements BatchedLevelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLevelRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLevelRequestRevisionRangeRule implements BatchedLevelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedLevelRequest): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedLevelRequestCodeLengthRule implements BatchedLevelRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLevelRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedLevelRequestQuantityRangeRule implements BatchedLevelRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedLevelRequest): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedLevelRequestRequiredCodeRule implements BatchedLevelRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLevelRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched level request. */
export class BatchedLevelRequestValidator {
  rules: BatchedLevelRequestRule[];

  constructor(rules: BatchedLevelRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedLevelRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedLevelRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedLevelRequest[]): Map<string, string[]> {
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

export function defaultBatchedLevelRequestValidator(): BatchedLevelRequestValidator {
  return new BatchedLevelRequestValidator(
    [
      new BatchedLevelRequestRequiredTitleRule("batched level request needs a value"),
      new BatchedLevelRequestRevisionRangeRule(80, 120),
      new BatchedLevelRequestCodeLengthRule(86400),
      new BatchedLevelRequestQuantityRangeRule(120, 3600),
      new BatchedLevelRequestRequiredCodeRule("batched level request needs a value"),
    ],
  );
}
