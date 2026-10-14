import * as text from "../../../../kit/text.js";
import { RollingEnrollmentWindow } from "./rolling-enrollment-window.js";

/** A rule a rolling enrollment window must pass. Check returns its problems, or none. */
export interface RollingEnrollmentWindowRule {
  check(item: RollingEnrollmentWindow): string[];
}

export class RollingEnrollmentWindowRequiredTitleRule implements RollingEnrollmentWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingEnrollmentWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingEnrollmentWindowAllowedCodeRule implements RollingEnrollmentWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingEnrollmentWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class RollingEnrollmentWindowArchivedGuardRule implements RollingEnrollmentWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingEnrollmentWindow): string[] {
    if (item.archived && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class RollingEnrollmentWindowMinimumRangeRule implements RollingEnrollmentWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingEnrollmentWindow): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingEnrollmentWindowRequiredSummaryRule implements RollingEnrollmentWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingEnrollmentWindow): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class RollingEnrollmentWindowUpdatedAtRangeRule implements RollingEnrollmentWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingEnrollmentWindow): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling enrollment window. */
export class RollingEnrollmentWindowValidator {
  rules: RollingEnrollmentWindowRule[];

  constructor(rules: RollingEnrollmentWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RollingEnrollmentWindow): string[] {
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

  requireValid(item: RollingEnrollmentWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingEnrollmentWindow[]): Map<string, string[]> {
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

export function defaultRollingEnrollmentWindowValidator(): RollingEnrollmentWindowValidator {
  return new RollingEnrollmentWindowValidator(
    [
      new RollingEnrollmentWindowRequiredTitleRule("rolling enrollment window needs this field"),
      new RollingEnrollmentWindowAllowedCodeRule(["strict"]),
      new RollingEnrollmentWindowArchivedGuardRule(7),
      new RollingEnrollmentWindowMinimumRangeRule(9.3, 3013.7),
      new RollingEnrollmentWindowRequiredSummaryRule("rolling enrollment window needs this field"),
      new RollingEnrollmentWindowUpdatedAtRangeRule(1000, 3600),
    ],
  );
}
