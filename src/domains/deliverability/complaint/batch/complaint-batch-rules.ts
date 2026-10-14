import { ComplaintBatch } from "./complaint-batch.js";

/** A rule a complaint batch must pass. Check returns its problems, or none. */
export interface ComplaintBatchRule {
  check(item: ComplaintBatch): string[];
}

export class ComplaintBatchNameLengthRule implements ComplaintBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBatchCodeLengthRule implements ComplaintBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBatchLocaleLengthRule implements ComplaintBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBatch): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBatchArchivedGuardRule implements ComplaintBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintBatch): string[] {
    if (item.archived && item.ceiling > this.limit) return [`ceiling ${item.ceiling} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a complaint batch. */
export class ComplaintBatchValidator {
  rules: ComplaintBatchRule[];

  constructor(rules: ComplaintBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintBatch[]): Map<string, string[]> {
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

export function defaultComplaintBatchValidator(): ComplaintBatchValidator {
  return new ComplaintBatchValidator(
    [
      new ComplaintBatchNameLengthRule(1000),
      new ComplaintBatchCodeLengthRule(64),
      new ComplaintBatchLocaleLengthRule(86400),
      new ComplaintBatchArchivedGuardRule(8.8),
    ],
  );
}
