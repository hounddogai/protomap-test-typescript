import * as text from "../../../../kit/text.js";
import { CappedCohortSnapshot } from "./capped-cohort-snapshot.js";

/** A rule a capped cohort snapshot must pass. Check returns its problems, or none. */
export interface CappedCohortSnapshotRule {
  check(item: CappedCohortSnapshot): string[];
}

export class CappedCohortSnapshotAllowedTitleRule implements CappedCohortSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedCohortSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class CappedCohortSnapshotCodePrefixRule implements CappedCohortSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedCohortSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedCohortSnapshotRequiredCodeRule implements CappedCohortSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCohortSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCohortSnapshotCodeLengthRule implements CappedCohortSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCohortSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped cohort snapshot. */
export class CappedCohortSnapshotValidator {
  rules: CappedCohortSnapshotRule[];

  constructor(rules: CappedCohortSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCohortSnapshot): string[] {
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

  requireValid(item: CappedCohortSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCohortSnapshot[]): Map<string, string[]> {
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

export function defaultCappedCohortSnapshotValidator(): CappedCohortSnapshotValidator {
  return new CappedCohortSnapshotValidator(
    [
      new CappedCohortSnapshotAllowedTitleRule(["manual"]),
      new CappedCohortSnapshotCodePrefixRule("REF"),
      new CappedCohortSnapshotRequiredCodeRule("capped cohort snapshot needs an entry"),
      new CappedCohortSnapshotCodeLengthRule(255),
    ],
  );
}
