import * as text from "../../../../kit/text.js";
import { AdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

/** A rule a adaptive payout assignment must pass. Check returns its problems, or none. */
export interface AdaptivePayoutAssignmentRule {
  check(item: AdaptivePayoutAssignment): string[];
}

export class AdaptivePayoutAssignmentRequiredTitleRule implements AdaptivePayoutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePayoutAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePayoutAssignmentExpiresAtRangeRule implements AdaptivePayoutAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePayoutAssignment): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePayoutAssignmentRequiredCodeRule implements AdaptivePayoutAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePayoutAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePayoutAssignmentTitleLengthRule implements AdaptivePayoutAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePayoutAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePayoutAssignmentAllowedTitleRule implements AdaptivePayoutAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePayoutAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

/** Runs every rule of a adaptive payout assignment. */
export class AdaptivePayoutAssignmentValidator {
  rules: AdaptivePayoutAssignmentRule[];

  constructor(rules: AdaptivePayoutAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePayoutAssignment): string[] {
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

  requireValid(item: AdaptivePayoutAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePayoutAssignment[]): Map<string, string[]> {
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

export function defaultAdaptivePayoutAssignmentValidator(): AdaptivePayoutAssignmentValidator {
  return new AdaptivePayoutAssignmentValidator(
    [
      new AdaptivePayoutAssignmentRequiredTitleRule("adaptive payout assignment needs an entry"),
      new AdaptivePayoutAssignmentExpiresAtRangeRule(64, 3600),
      new AdaptivePayoutAssignmentRequiredCodeRule("adaptive payout assignment needs an entry"),
      new AdaptivePayoutAssignmentTitleLengthRule(80),
      new AdaptivePayoutAssignmentAllowedTitleRule(["strict", "weighted", "legacy"]),
    ],
  );
}
