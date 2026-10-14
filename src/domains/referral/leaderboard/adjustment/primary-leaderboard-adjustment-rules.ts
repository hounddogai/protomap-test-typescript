import * as text from "../../../../kit/text.js";
import { PrimaryLeaderboardAdjustment } from "./primary-leaderboard-adjustment.js";

/** A rule a primary leaderboard adjustment must pass. Check returns its problems, or none. */
export interface PrimaryLeaderboardAdjustmentRule {
  check(item: PrimaryLeaderboardAdjustment): string[];
}

export class PrimaryLeaderboardAdjustmentMarginRangeRule implements PrimaryLeaderboardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLeaderboardAdjustment): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryLeaderboardAdjustmentThresholdRangeRule implements PrimaryLeaderboardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLeaderboardAdjustment): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryLeaderboardAdjustmentWindowDaysRangeRule implements PrimaryLeaderboardAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLeaderboardAdjustment): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryLeaderboardAdjustmentAllowedCodeRule implements PrimaryLeaderboardAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryLeaderboardAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class PrimaryLeaderboardAdjustmentCodeLengthRule implements PrimaryLeaderboardAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLeaderboardAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary leaderboard adjustment. */
export class PrimaryLeaderboardAdjustmentValidator {
  rules: PrimaryLeaderboardAdjustmentRule[];

  constructor(rules: PrimaryLeaderboardAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryLeaderboardAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryLeaderboardAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryLeaderboardAdjustment[]): Map<string, string[]> {
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

export function defaultPrimaryLeaderboardAdjustmentValidator(): PrimaryLeaderboardAdjustmentValidator {
  return new PrimaryLeaderboardAdjustmentValidator(
    [
      new PrimaryLeaderboardAdjustmentMarginRangeRule(7.9, 2265.4),
      new PrimaryLeaderboardAdjustmentThresholdRangeRule(3.4, 941.9),
      new PrimaryLeaderboardAdjustmentWindowDaysRangeRule(80, 255),
      new PrimaryLeaderboardAdjustmentAllowedCodeRule(["tiered", "lenient"]),
      new PrimaryLeaderboardAdjustmentCodeLengthRule(80),
    ],
  );
}
