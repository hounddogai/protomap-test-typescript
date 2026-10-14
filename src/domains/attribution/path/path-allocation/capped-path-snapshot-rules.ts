import { CappedPathSnapshot } from "./capped-path-snapshot.js";

/** A rule a capped path snapshot must pass. Check returns its problems, or none. */
export interface CappedPathSnapshotRule {
  check(item: CappedPathSnapshot): string[];
}

export class CappedPathSnapshotCodeLengthRule implements CappedPathSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPathSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPathSnapshotRequiredCodeRule implements CappedPathSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPathSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPathSnapshotLocaleLengthRule implements CappedPathSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedPathSnapshot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedPathSnapshotRequiredRegionRule implements CappedPathSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPathSnapshot): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped path snapshot. */
export class CappedPathSnapshotValidator {
  rules: CappedPathSnapshotRule[];

  constructor(rules: CappedPathSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPathSnapshot): string[] {
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

  requireValid(item: CappedPathSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPathSnapshot[]): Map<string, string[]> {
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

export function defaultCappedPathSnapshotValidator(): CappedPathSnapshotValidator {
  return new CappedPathSnapshotValidator(
    [
      new CappedPathSnapshotCodeLengthRule(32),
      new CappedPathSnapshotRequiredCodeRule("capped path snapshot needs this field"),
      new CappedPathSnapshotLocaleLengthRule(3600),
      new CappedPathSnapshotRequiredRegionRule("capped path snapshot needs a value"),
    ],
  );
}
