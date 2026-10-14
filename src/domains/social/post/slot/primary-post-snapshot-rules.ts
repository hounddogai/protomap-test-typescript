import * as text from "../../../../kit/text.js";
import { PrimaryPostSnapshot } from "./primary-post-snapshot.js";

/** A rule a primary post snapshot must pass. Check returns its problems, or none. */
export interface PrimaryPostSnapshotRule {
  check(item: PrimaryPostSnapshot): string[];
}

export class PrimaryPostSnapshotCodeLengthRule implements PrimaryPostSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPostSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryPostSnapshotAllowedLabelRule implements PrimaryPostSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPostSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class PrimaryPostSnapshotLabelLengthRule implements PrimaryPostSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPostSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary post snapshot. */
export class PrimaryPostSnapshotValidator {
  rules: PrimaryPostSnapshotRule[];

  constructor(rules: PrimaryPostSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPostSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPostSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPostSnapshot[]): Map<string, string[]> {
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

export function defaultPrimaryPostSnapshotValidator(): PrimaryPostSnapshotValidator {
  return new PrimaryPostSnapshotValidator(
    [
      new PrimaryPostSnapshotCodeLengthRule(1000),
      new PrimaryPostSnapshotAllowedLabelRule(["adaptive", "manual", "primary"]),
      new PrimaryPostSnapshotLabelLengthRule(16),
    ],
  );
}
