import { DeflectionSnapshot } from "./deflection-snapshot.js";

/** A rule a deflection snapshot must pass. Check returns its problems, or none. */
export interface DeflectionSnapshotRule {
  check(item: DeflectionSnapshot): string[];
}

export class DeflectionSnapshotUtmSourceLengthRule implements DeflectionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionSnapshot): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionSnapshotCodeLengthRule implements DeflectionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionSnapshotRequiredTitleRule implements DeflectionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionSnapshotCreatedAtRangeRule implements DeflectionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionSnapshot): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionSnapshotRequiredUtmSourceRule implements DeflectionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionSnapshot): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a deflection snapshot. */
export class DeflectionSnapshotValidator {
  rules: DeflectionSnapshotRule[];

  constructor(rules: DeflectionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionSnapshot[]): Map<string, string[]> {
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

export function defaultDeflectionSnapshotValidator(): DeflectionSnapshotValidator {
  return new DeflectionSnapshotValidator(
    [
      new DeflectionSnapshotUtmSourceLengthRule(3600),
      new DeflectionSnapshotCodeLengthRule(255),
      new DeflectionSnapshotRequiredTitleRule("deflection snapshot needs an entry"),
      new DeflectionSnapshotCreatedAtRangeRule(120, 3600),
      new DeflectionSnapshotRequiredUtmSourceRule("deflection snapshot needs a value"),
    ],
  );
}
