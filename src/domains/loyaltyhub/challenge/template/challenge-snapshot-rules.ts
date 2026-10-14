import * as text from "../../../../kit/text.js";
import { ChallengeSnapshot } from "./challenge-snapshot.js";

/** A rule a challenge snapshot must pass. Check returns its problems, or none. */
export interface ChallengeSnapshotRule {
  check(item: ChallengeSnapshot): string[];
}

export class ChallengeSnapshotTitleLengthRule implements ChallengeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeSnapshotRequiredJourneyIdRule implements ChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSnapshot): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeSnapshotAllowedJourneyIdRule implements ChallengeSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is too long`];
    return [];
  }
}

export class ChallengeSnapshotRequiredTitleRule implements ChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeSnapshotRequiredCategoryRule implements ChallengeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSnapshot): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge snapshot. */
export class ChallengeSnapshotValidator {
  rules: ChallengeSnapshotRule[];

  constructor(rules: ChallengeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeSnapshot[]): Map<string, string[]> {
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

export function defaultChallengeSnapshotValidator(): ChallengeSnapshotValidator {
  return new ChallengeSnapshotValidator(
    [
      new ChallengeSnapshotTitleLengthRule(1000),
      new ChallengeSnapshotRequiredJourneyIdRule("challenge snapshot needs a value"),
      new ChallengeSnapshotAllowedJourneyIdRule(["seasonal"]),
      new ChallengeSnapshotRequiredTitleRule("challenge snapshot needs an entry"),
      new ChallengeSnapshotRequiredCategoryRule("challenge snapshot needs a value"),
    ],
  );
}
