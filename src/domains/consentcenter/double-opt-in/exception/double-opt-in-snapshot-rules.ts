import * as text from "../../../../kit/text.js";
import { DoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

/** A rule a double opt in snapshot must pass. Check returns its problems, or none. */
export interface DoubleOptInSnapshotRule {
  check(item: DoubleOptInSnapshot): string[];
}

export class DoubleOptInSnapshotAllowedNameRule implements DoubleOptInSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class DoubleOptInSnapshotReviewerLengthRule implements DoubleOptInSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInSnapshot): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInSnapshotRequiredCodeRule implements DoubleOptInSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in snapshot. */
export class DoubleOptInSnapshotValidator {
  rules: DoubleOptInSnapshotRule[];

  constructor(rules: DoubleOptInSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInSnapshot[]): Map<string, string[]> {
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

export function defaultDoubleOptInSnapshotValidator(): DoubleOptInSnapshotValidator {
  return new DoubleOptInSnapshotValidator(
    [
      new DoubleOptInSnapshotAllowedNameRule(["capped", "primary"]),
      new DoubleOptInSnapshotReviewerLengthRule(255),
      new DoubleOptInSnapshotRequiredCodeRule("double opt in snapshot needs a value"),
    ],
  );
}
