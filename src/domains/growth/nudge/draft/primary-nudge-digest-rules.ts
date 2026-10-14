import * as text from "../../../../kit/text.js";
import { PrimaryNudgeDigest } from "./primary-nudge-digest.js";

/** A rule a primary nudge digest must pass. Check returns its problems, or none. */
export interface PrimaryNudgeDigestRule {
  check(item: PrimaryNudgeDigest): string[];
}

export class PrimaryNudgeDigestDurationMinutesRangeRule implements PrimaryNudgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeDigest): string[] {
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

export class PrimaryNudgeDigestAllowedTitleRule implements PrimaryNudgeDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryNudgeDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class PrimaryNudgeDigestEndsAtRangeRule implements PrimaryNudgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeDigest): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryNudgeDigestRequiredCodeRule implements PrimaryNudgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryNudgeDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryNudgeDigestLimitRangeRule implements PrimaryNudgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeDigest): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary nudge digest. */
export class PrimaryNudgeDigestValidator {
  rules: PrimaryNudgeDigestRule[];

  constructor(rules: PrimaryNudgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryNudgeDigest): string[] {
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

  requireValid(item: PrimaryNudgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryNudgeDigest[]): Map<string, string[]> {
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

export function defaultPrimaryNudgeDigestValidator(): PrimaryNudgeDigestValidator {
  return new PrimaryNudgeDigestValidator(
    [
      new PrimaryNudgeDigestDurationMinutesRangeRule(64, 1000),
      new PrimaryNudgeDigestAllowedTitleRule([]),
      new PrimaryNudgeDigestEndsAtRangeRule(80, 3600),
      new PrimaryNudgeDigestRequiredCodeRule("primary nudge digest needs an entry"),
      new PrimaryNudgeDigestLimitRangeRule(64, 1000),
    ],
  );
}
