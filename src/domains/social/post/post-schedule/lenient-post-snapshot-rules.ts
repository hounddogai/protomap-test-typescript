import { LenientPostSnapshot } from "./lenient-post-snapshot.js";

/** A rule a lenient post snapshot must pass. Check returns its problems, or none. */
export interface LenientPostSnapshotRule {
  check(item: LenientPostSnapshot): string[];
}

export class LenientPostSnapshotMarginRangeRule implements LenientPostSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPostSnapshot): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPostSnapshotNameLengthRule implements LenientPostSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostSnapshotRequiredCodeRule implements LenientPostSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPostSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient post snapshot. */
export class LenientPostSnapshotValidator {
  rules: LenientPostSnapshotRule[];

  constructor(rules: LenientPostSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPostSnapshot): string[] {
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

  requireValid(item: LenientPostSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPostSnapshot[]): Map<string, string[]> {
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

export function defaultLenientPostSnapshotValidator(): LenientPostSnapshotValidator {
  return new LenientPostSnapshotValidator(
    [
      new LenientPostSnapshotMarginRangeRule(0.4, 2465.1),
      new LenientPostSnapshotNameLengthRule(255),
      new LenientPostSnapshotRequiredCodeRule("lenient post snapshot needs this field"),
    ],
  );
}
