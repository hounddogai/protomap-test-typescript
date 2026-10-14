import * as text from "../../../../kit/text.js";
import { ReputationCycle } from "./reputation-cycle.js";

/** A rule a reputation cycle must pass. Check returns its problems, or none. */
export interface ReputationCycleRule {
  check(item: ReputationCycle): string[];
}

export class ReputationCycleRatioRangeRule implements ReputationCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationCycle): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationCycleAllowedCodeRule implements ReputationCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class ReputationCycleArchivedGuardRule implements ReputationCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReputationCycle): string[] {
    if (item.archived && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class ReputationCycleTitleLengthRule implements ReputationCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation cycle. */
export class ReputationCycleValidator {
  rules: ReputationCycleRule[];

  constructor(rules: ReputationCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationCycle): string[] {
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

  requireValid(item: ReputationCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationCycle[]): Map<string, string[]> {
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

export function defaultReputationCycleValidator(): ReputationCycleValidator {
  return new ReputationCycleValidator(
    [
      new ReputationCycleRatioRangeRule(6.8, 2370.9),
      new ReputationCycleAllowedCodeRule(["default", "fallback", "adaptive"]),
      new ReputationCycleArchivedGuardRule(4),
      new ReputationCycleTitleLengthRule(64),
    ],
  );
}
