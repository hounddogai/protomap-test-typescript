import { OptOutSnapshot } from "./opt-out-snapshot.js";

/** A rule a opt out snapshot must pass. Check returns its problems, or none. */
export interface OptOutSnapshotRule {
  check(item: OptOutSnapshot): string[];
}

export class OptOutSnapshotRegionLengthRule implements OptOutSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutSnapshot): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutSnapshotQuantityRangeRule implements OptOutSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutSnapshot): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutSnapshotRequiredLabelRule implements OptOutSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutSnapshotRequiredContactEmailRule implements OptOutSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutSnapshot): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out snapshot. */
export class OptOutSnapshotValidator {
  rules: OptOutSnapshotRule[];

  constructor(rules: OptOutSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutSnapshot): string[] {
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

  requireValid(item: OptOutSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutSnapshot[]): Map<string, string[]> {
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

export function defaultOptOutSnapshotValidator(): OptOutSnapshotValidator {
  return new OptOutSnapshotValidator(
    [
      new OptOutSnapshotRegionLengthRule(86400),
      new OptOutSnapshotQuantityRangeRule(32, 80),
      new OptOutSnapshotRequiredLabelRule("opt out snapshot needs an entry"),
      new OptOutSnapshotRequiredContactEmailRule("opt out snapshot needs this field"),
    ],
  );
}
