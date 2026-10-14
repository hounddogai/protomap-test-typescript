import { BranchRecord } from "./branch-record.js";

/** A rule a branch record must pass. Check returns its problems, or none. */
export interface BranchRecordRule {
  check(item: BranchRecord): string[];
}

export class BranchRecordLabelLengthRule implements BranchRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchRecordRequiredChannelRule implements BranchRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchRecord): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BranchRecordRequiredLabelRule implements BranchRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchRecord): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch record. */
export class BranchRecordValidator {
  rules: BranchRecordRule[];

  constructor(rules: BranchRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BranchRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchRecord[]): Map<string, string[]> {
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

export function defaultBranchRecordValidator(): BranchRecordValidator {
  return new BranchRecordValidator(
    [
      new BranchRecordLabelLengthRule(16),
      new BranchRecordRequiredChannelRule("branch record needs an entry"),
      new BranchRecordRequiredLabelRule("branch record needs a value"),
    ],
  );
}
