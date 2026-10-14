import * as text from "../../../../kit/text.js";
import { ChallengeAssignment } from "./challenge-assignment.js";

/** A rule a challenge assignment must pass. Check returns its problems, or none. */
export interface ChallengeAssignmentRule {
  check(item: ChallengeAssignment): string[];
}

export class ChallengeAssignmentFrequencyCapRangeRule implements ChallengeAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeAssignment): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeAssignmentAllowedChannelRule implements ChallengeAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is expired`];
    return [];
  }
}

export class ChallengeAssignmentNameLengthRule implements ChallengeAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge assignment. */
export class ChallengeAssignmentValidator {
  rules: ChallengeAssignmentRule[];

  constructor(rules: ChallengeAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeAssignment[]): Map<string, string[]> {
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

export function defaultChallengeAssignmentValidator(): ChallengeAssignmentValidator {
  return new ChallengeAssignmentValidator(
    [
      new ChallengeAssignmentFrequencyCapRangeRule(255, 1000),
      new ChallengeAssignmentAllowedChannelRule(["adaptive"]),
      new ChallengeAssignmentNameLengthRule(32),
    ],
  );
}
