import * as text from "../../../../kit/text.js";
import { StrictLevelNotice } from "./strict-level-notice.js";

/** A rule a strict level notice must pass. Check returns its problems, or none. */
export interface StrictLevelNoticeRule {
  check(item: StrictLevelNotice): string[];
}

export class StrictLevelNoticeRatioRangeRule implements StrictLevelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLevelNotice): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictLevelNoticeExpiresAtRangeRule implements StrictLevelNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictLevelNotice): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictLevelNoticeAllowedPhoneRule implements StrictLevelNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictLevelNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is unknown`];
    return [];
  }
}

export class StrictLevelNoticeRequiredReviewerRule implements StrictLevelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLevelNotice): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict level notice. */
export class StrictLevelNoticeValidator {
  rules: StrictLevelNoticeRule[];

  constructor(rules: StrictLevelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StrictLevelNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictLevelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictLevelNotice[]): Map<string, string[]> {
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

export function defaultStrictLevelNoticeValidator(): StrictLevelNoticeValidator {
  return new StrictLevelNoticeValidator(
    [
      new StrictLevelNoticeRatioRangeRule(2.9, 3671),
      new StrictLevelNoticeExpiresAtRangeRule(32, 3600),
      new StrictLevelNoticeAllowedPhoneRule(["scheduled"]),
      new StrictLevelNoticeRequiredReviewerRule("strict level notice needs a value"),
    ],
  );
}
