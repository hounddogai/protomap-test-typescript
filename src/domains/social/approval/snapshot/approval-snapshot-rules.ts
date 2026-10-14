import { ApprovalSnapshot } from "./approval-snapshot.js";

/** A rule a approval snapshot must pass. Check returns its problems, or none. */
export interface ApprovalSnapshotRule {
  check(item: ApprovalSnapshot): string[];
}

export class ApprovalSnapshotCodeLengthRule implements ApprovalSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalSnapshotNameLengthRule implements ApprovalSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalSnapshotRequiredNameRule implements ApprovalSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalSnapshotSendAtRangeRule implements ApprovalSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalSnapshot): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a approval snapshot. */
export class ApprovalSnapshotValidator {
  rules: ApprovalSnapshotRule[];

  constructor(rules: ApprovalSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalSnapshot): string[] {
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

  requireValid(item: ApprovalSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalSnapshot[]): Map<string, string[]> {
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

export function defaultApprovalSnapshotValidator(): ApprovalSnapshotValidator {
  return new ApprovalSnapshotValidator(
    [
      new ApprovalSnapshotCodeLengthRule(86400),
      new ApprovalSnapshotNameLengthRule(80),
      new ApprovalSnapshotRequiredNameRule("approval snapshot needs a value"),
      new ApprovalSnapshotSendAtRangeRule(80, 86400),
    ],
  );
}
