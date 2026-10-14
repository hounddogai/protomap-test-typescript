import { CappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

/** A rule a capped challenge snapshot must pass. Check returns its problems, or none. */
export interface CappedChallengeSnapshotRule {
  check(item: CappedChallengeSnapshot): string[];
}

export class CappedChallengeSnapshotScoreRangeRule implements CappedChallengeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedChallengeSnapshot): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedChallengeSnapshotNotesLengthRule implements CappedChallengeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedChallengeSnapshot): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedChallengeSnapshotCodePrefixRule implements CappedChallengeSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedChallengeSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedChallengeSnapshotRequiredCodeRule implements CappedChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedChallengeSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedChallengeSnapshotLabelLengthRule implements CappedChallengeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedChallengeSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped challenge snapshot. */
export class CappedChallengeSnapshotValidator {
  rules: CappedChallengeSnapshotRule[];

  constructor(rules: CappedChallengeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedChallengeSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedChallengeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedChallengeSnapshot[]): Map<string, string[]> {
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

export function defaultCappedChallengeSnapshotValidator(): CappedChallengeSnapshotValidator {
  return new CappedChallengeSnapshotValidator(
    [
      new CappedChallengeSnapshotScoreRangeRule(4.6, 1654.2),
      new CappedChallengeSnapshotNotesLengthRule(64),
      new CappedChallengeSnapshotCodePrefixRule("Q"),
      new CappedChallengeSnapshotRequiredCodeRule("capped challenge snapshot needs this field"),
      new CappedChallengeSnapshotLabelLengthRule(80),
    ],
  );
}
