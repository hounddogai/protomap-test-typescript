import * as text from "../../../../kit/text.js";
import { ChallengeBaseline } from "./challenge-baseline.js";

/** A rule a challenge baseline must pass. Check returns its problems, or none. */
export interface ChallengeBaselineRule {
  check(item: ChallengeBaseline): string[];
}

export class ChallengeBaselinePhoneLengthRule implements ChallengeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeBaseline): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeBaselineStartsAtRangeRule implements ChallengeBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeBaseline): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeBaselineCodePrefixRule implements ChallengeBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeBaselineAllowedLabelRule implements ChallengeBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class ChallengeBaselineLabelLengthRule implements ChallengeBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge baseline. */
export class ChallengeBaselineValidator {
  rules: ChallengeBaselineRule[];

  constructor(rules: ChallengeBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeBaseline): string[] {
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

  requireValid(item: ChallengeBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeBaseline[]): Map<string, string[]> {
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

export function defaultChallengeBaselineValidator(): ChallengeBaselineValidator {
  return new ChallengeBaselineValidator(
    [
      new ChallengeBaselinePhoneLengthRule(1000),
      new ChallengeBaselineStartsAtRangeRule(32, 3600),
      new ChallengeBaselineCodePrefixRule("Q"),
      new ChallengeBaselineAllowedLabelRule(["manual", "manual", "global"]),
      new ChallengeBaselineLabelLengthRule(16),
    ],
  );
}
