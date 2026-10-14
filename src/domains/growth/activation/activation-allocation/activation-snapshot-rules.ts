import { ActivationSnapshot } from "./activation-snapshot.js";

/** A rule a activation snapshot must pass. Check returns its problems, or none. */
export interface ActivationSnapshotRule {
  check(item: ActivationSnapshot): string[];
}

export class ActivationSnapshotRequiredNotesRule implements ActivationSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSnapshot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationSnapshotNotesLengthRule implements ActivationSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationSnapshot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationSnapshotRequiredSummaryRule implements ActivationSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationSnapshot): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationSnapshotVersionRangeRule implements ActivationSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationSnapshot): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationSnapshotImpressionsRangeRule implements ActivationSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationSnapshot): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a activation snapshot. */
export class ActivationSnapshotValidator {
  rules: ActivationSnapshotRule[];

  constructor(rules: ActivationSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationSnapshot): string[] {
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

  requireValid(item: ActivationSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationSnapshot[]): Map<string, string[]> {
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

export function defaultActivationSnapshotValidator(): ActivationSnapshotValidator {
  return new ActivationSnapshotValidator(
    [
      new ActivationSnapshotRequiredNotesRule("activation snapshot needs an entry"),
      new ActivationSnapshotNotesLengthRule(1000),
      new ActivationSnapshotRequiredSummaryRule("activation snapshot needs this field"),
      new ActivationSnapshotVersionRangeRule(86400, 86400),
      new ActivationSnapshotImpressionsRangeRule(255, 3600),
    ],
  );
}
