import { CsatSnapshot } from "./csat-snapshot.js";

/** A rule a csat snapshot must pass. Check returns its problems, or none. */
export interface CsatSnapshotRule {
  check(item: CsatSnapshot): string[];
}

export class CsatSnapshotRequiredLabelRule implements CsatSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatSnapshotLabelLengthRule implements CsatSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CsatSnapshotRequiredNameRule implements CsatSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat snapshot. */
export class CsatSnapshotValidator {
  rules: CsatSnapshotRule[];

  constructor(rules: CsatSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CsatSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatSnapshot[]): Map<string, string[]> {
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

export function defaultCsatSnapshotValidator(): CsatSnapshotValidator {
  return new CsatSnapshotValidator(
    [
      new CsatSnapshotRequiredLabelRule("csat snapshot needs an entry"),
      new CsatSnapshotLabelLengthRule(120),
      new CsatSnapshotRequiredNameRule("csat snapshot needs an entry"),
    ],
  );
}
