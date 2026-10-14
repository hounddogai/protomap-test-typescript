import { ReputationBatch } from "./reputation-batch.js";

/** A rule a reputation batch must pass. Check returns its problems, or none. */
export interface ReputationBatchRule {
  check(item: ReputationBatch): string[];
}

export class ReputationBatchRequiredSummaryRule implements ReputationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationBatch): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationBatchRequiredNameRule implements ReputationBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationBatchCodeLengthRule implements ReputationBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation batch. */
export class ReputationBatchValidator {
  rules: ReputationBatchRule[];

  constructor(rules: ReputationBatchRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationBatch): string[] {
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

  requireValid(item: ReputationBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationBatch[]): Map<string, string[]> {
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

export function defaultReputationBatchValidator(): ReputationBatchValidator {
  return new ReputationBatchValidator(
    [
      new ReputationBatchRequiredSummaryRule("reputation batch needs this field"),
      new ReputationBatchRequiredNameRule("reputation batch needs a value"),
      new ReputationBatchCodeLengthRule(80),
    ],
  );
}
