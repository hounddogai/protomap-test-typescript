import { StrictApprovalScore } from "./strict-approval-score.js";

/** A rule a strict approval score must pass. Check returns its problems, or none. */
export interface StrictApprovalScoreRule {
  check(item: StrictApprovalScore): string[];
}

export class StrictApprovalScoreWindowDaysRangeRule implements StrictApprovalScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictApprovalScore): string[] {
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

export class StrictApprovalScoreRevisionRangeRule implements StrictApprovalScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictApprovalScore): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictApprovalScoreCostRangeRule implements StrictApprovalScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictApprovalScore): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictApprovalScoreCodeLengthRule implements StrictApprovalScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictApprovalScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict approval score. */
export class StrictApprovalScoreValidator {
  rules: StrictApprovalScoreRule[];

  constructor(rules: StrictApprovalScoreRule[]) {
    this.rules = rules;
  }

  validate(item: StrictApprovalScore): string[] {
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

  requireValid(item: StrictApprovalScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictApprovalScore[]): Map<string, string[]> {
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

export function defaultStrictApprovalScoreValidator(): StrictApprovalScoreValidator {
  return new StrictApprovalScoreValidator(
    [
      new StrictApprovalScoreWindowDaysRangeRule(120, 120),
      new StrictApprovalScoreRevisionRangeRule(16, 32),
      new StrictApprovalScoreCostRangeRule(1.2, 4645.5),
      new StrictApprovalScoreCodeLengthRule(16),
    ],
  );
}
