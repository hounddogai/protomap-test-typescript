import { DefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

/** A rule a default frequency snapshot must pass. Check returns its problems, or none. */
export interface DefaultFrequencySnapshotRule {
  check(item: DefaultFrequencySnapshot): string[];
}

export class DefaultFrequencySnapshotDurationMinutesRangeRule implements DefaultFrequencySnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencySnapshot): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultFrequencySnapshotSequenceRangeRule implements DefaultFrequencySnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFrequencySnapshot): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultFrequencySnapshotCodePrefixRule implements DefaultFrequencySnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultFrequencySnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default frequency snapshot. */
export class DefaultFrequencySnapshotValidator {
  rules: DefaultFrequencySnapshotRule[];

  constructor(rules: DefaultFrequencySnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFrequencySnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultFrequencySnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFrequencySnapshot[]): Map<string, string[]> {
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

export function defaultDefaultFrequencySnapshotValidator(): DefaultFrequencySnapshotValidator {
  return new DefaultFrequencySnapshotValidator(
    [
      new DefaultFrequencySnapshotDurationMinutesRangeRule(16, 32),
      new DefaultFrequencySnapshotSequenceRangeRule(120, 3600),
      new DefaultFrequencySnapshotCodePrefixRule("X"),
    ],
  );
}
