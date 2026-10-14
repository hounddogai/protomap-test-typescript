import { FrequencySnapshot } from "./frequency-snapshot.js";

/** A rule a frequency snapshot must pass. Check returns its problems, or none. */
export interface FrequencySnapshotRule {
  check(item: FrequencySnapshot): string[];
}

export class FrequencySnapshotCodeLengthRule implements FrequencySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencySnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencySnapshotCohortLengthRule implements FrequencySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencySnapshot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencySnapshotRequiredSourceRule implements FrequencySnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencySnapshot): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencySnapshotRequiredTitleRule implements FrequencySnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencySnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency snapshot. */
export class FrequencySnapshotValidator {
  rules: FrequencySnapshotRule[];

  constructor(rules: FrequencySnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencySnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencySnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencySnapshot[]): Map<string, string[]> {
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

export function defaultFrequencySnapshotValidator(): FrequencySnapshotValidator {
  return new FrequencySnapshotValidator(
    [
      new FrequencySnapshotCodeLengthRule(16),
      new FrequencySnapshotCohortLengthRule(80),
      new FrequencySnapshotRequiredSourceRule("frequency snapshot needs this field"),
      new FrequencySnapshotRequiredTitleRule("frequency snapshot needs an entry"),
    ],
  );
}
