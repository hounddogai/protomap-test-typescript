import { BatchedInsightException } from "./batched-insight-exception.js";

/** A rule a batched insight exception must pass. Check returns its problems, or none. */
export interface BatchedInsightExceptionRule {
  check(item: BatchedInsightException): string[];
}

export class BatchedInsightExceptionLocaleLengthRule implements BatchedInsightExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightException): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInsightExceptionCodePrefixRule implements BatchedInsightExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedInsightException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedInsightExceptionTitleLengthRule implements BatchedInsightExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInsightException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched insight exception. */
export class BatchedInsightExceptionValidator {
  rules: BatchedInsightExceptionRule[];

  constructor(rules: BatchedInsightExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInsightException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedInsightException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInsightException[]): Map<string, string[]> {
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

export function defaultBatchedInsightExceptionValidator(): BatchedInsightExceptionValidator {
  return new BatchedInsightExceptionValidator(
    [
      new BatchedInsightExceptionLocaleLengthRule(32),
      new BatchedInsightExceptionCodePrefixRule("OPS"),
      new BatchedInsightExceptionTitleLengthRule(86400),
    ],
  );
}
