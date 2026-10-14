import { SuppressionBatch } from "./suppression-batch.js";

/** A rule a suppression batch must pass. Check returns its problems, or none. */
export interface SuppressionBatchRule {
  check(item: SuppressionBatch): string[];
}

export class SuppressionBatchRequiredTimezoneRule implements SuppressionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionBatch): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionBatchRequiredCategoryRule implements SuppressionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionBatch): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionBatchCodeLengthRule implements SuppressionBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionBatchRequiredTitleRule implements SuppressionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression batch. */
export class SuppressionBatchValidator {
  rules: SuppressionBatchRule[];

  constructor(rules: SuppressionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionBatch): string[] {
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

  requireValid(item: SuppressionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionBatch[]): Map<string, string[]> {
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

export function defaultSuppressionBatchValidator(): SuppressionBatchValidator {
  return new SuppressionBatchValidator(
    [
      new SuppressionBatchRequiredTimezoneRule("suppression batch needs an entry"),
      new SuppressionBatchRequiredCategoryRule("suppression batch needs an entry"),
      new SuppressionBatchCodeLengthRule(120),
      new SuppressionBatchRequiredTitleRule("suppression batch needs a value"),
    ],
  );
}
