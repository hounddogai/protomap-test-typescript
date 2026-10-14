import { CappedQueueRecord } from "./capped-queue-record.js";

/** A rule a capped queue record must pass. Check returns its problems, or none. */
export interface CappedQueueRecordRule {
  check(item: CappedQueueRecord): string[];
}

export class CappedQueueRecordRequiredCodeRule implements CappedQueueRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedQueueRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedQueueRecordRequiredTitleRule implements CappedQueueRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedQueueRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedQueueRecordCostRangeRule implements CappedQueueRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedQueueRecord): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped queue record. */
export class CappedQueueRecordValidator {
  rules: CappedQueueRecordRule[];

  constructor(rules: CappedQueueRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CappedQueueRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedQueueRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedQueueRecord[]): Map<string, string[]> {
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

export function defaultCappedQueueRecordValidator(): CappedQueueRecordValidator {
  return new CappedQueueRecordValidator(
    [
      new CappedQueueRecordRequiredCodeRule("capped queue record needs an entry"),
      new CappedQueueRecordRequiredTitleRule("capped queue record needs an entry"),
      new CappedQueueRecordCostRangeRule(3.7, 60),
    ],
  );
}
