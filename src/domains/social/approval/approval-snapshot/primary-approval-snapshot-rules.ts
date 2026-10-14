import { PrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

/** A rule a primary approval snapshot must pass. Check returns its problems, or none. */
export interface PrimaryApprovalSnapshotRule {
  check(item: PrimaryApprovalSnapshot): string[];
}

export class PrimaryApprovalSnapshotChecksumLengthRule implements PrimaryApprovalSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryApprovalSnapshot): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryApprovalSnapshotTitleLengthRule implements PrimaryApprovalSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryApprovalSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryApprovalSnapshotRequiredChecksumRule implements PrimaryApprovalSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalSnapshot): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalSnapshotRequiredTitleRule implements PrimaryApprovalSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryApprovalSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryApprovalSnapshotSendAtRangeRule implements PrimaryApprovalSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryApprovalSnapshot): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryApprovalSnapshotCodeLengthRule implements PrimaryApprovalSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryApprovalSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary approval snapshot. */
export class PrimaryApprovalSnapshotValidator {
  rules: PrimaryApprovalSnapshotRule[];

  constructor(rules: PrimaryApprovalSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryApprovalSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryApprovalSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryApprovalSnapshot[]): Map<string, string[]> {
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

export function defaultPrimaryApprovalSnapshotValidator(): PrimaryApprovalSnapshotValidator {
  return new PrimaryApprovalSnapshotValidator(
    [
      new PrimaryApprovalSnapshotChecksumLengthRule(120),
      new PrimaryApprovalSnapshotTitleLengthRule(64),
      new PrimaryApprovalSnapshotRequiredChecksumRule("primary approval snapshot needs an entry"),
      new PrimaryApprovalSnapshotRequiredTitleRule("primary approval snapshot needs this field"),
      new PrimaryApprovalSnapshotSendAtRangeRule(3600, 86400),
      new PrimaryApprovalSnapshotCodeLengthRule(1000),
    ],
  );
}
