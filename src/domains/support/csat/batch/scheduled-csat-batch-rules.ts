import { ScheduledCsatBatch } from "./scheduled-csat-batch.js";

/** A rule a scheduled csat batch must pass. Check returns its problems, or none. */
export interface ScheduledCsatBatchRule {
  check(item: ScheduledCsatBatch): string[];
}

export class ScheduledCsatBatchCodePrefixRule implements ScheduledCsatBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledCsatBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledCsatBatchLocaleLengthRule implements ScheduledCsatBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledCsatBatch): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledCsatBatchRequiredCodeRule implements ScheduledCsatBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCsatBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled csat batch. */
export class ScheduledCsatBatchValidator {
  rules: ScheduledCsatBatchRule[];

  constructor(rules: ScheduledCsatBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCsatBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCsatBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCsatBatch[]): Map<string, string[]> {
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

export function defaultScheduledCsatBatchValidator(): ScheduledCsatBatchValidator {
  return new ScheduledCsatBatchValidator(
    [
      new ScheduledCsatBatchCodePrefixRule("Q"),
      new ScheduledCsatBatchLocaleLengthRule(1000),
      new ScheduledCsatBatchRequiredCodeRule("scheduled csat batch needs a value"),
    ],
  );
}
