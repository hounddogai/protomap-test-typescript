import * as text from "../../../../kit/text.js";
import { WeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

/** A rule a weighted challenge snapshot must pass. Check returns its problems, or none. */
export interface WeightedChallengeSnapshotRule {
  check(item: WeightedChallengeSnapshot): string[];
}

export class WeightedChallengeSnapshotCountryLengthRule implements WeightedChallengeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedChallengeSnapshot): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedChallengeSnapshotCodeLengthRule implements WeightedChallengeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedChallengeSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedChallengeSnapshotAllowedNameRule implements WeightedChallengeSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedChallengeSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class WeightedChallengeSnapshotRequiredNameRule implements WeightedChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedChallengeSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted challenge snapshot. */
export class WeightedChallengeSnapshotValidator {
  rules: WeightedChallengeSnapshotRule[];

  constructor(rules: WeightedChallengeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedChallengeSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedChallengeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedChallengeSnapshot[]): Map<string, string[]> {
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

export function defaultWeightedChallengeSnapshotValidator(): WeightedChallengeSnapshotValidator {
  return new WeightedChallengeSnapshotValidator(
    [
      new WeightedChallengeSnapshotCountryLengthRule(120),
      new WeightedChallengeSnapshotCodeLengthRule(86400),
      new WeightedChallengeSnapshotAllowedNameRule(["capped", "tiered", "tiered"]),
      new WeightedChallengeSnapshotRequiredNameRule("weighted challenge snapshot needs a value"),
    ],
  );
}
