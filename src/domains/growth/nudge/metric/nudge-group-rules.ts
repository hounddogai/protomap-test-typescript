import { NudgeGroup } from "./nudge-group.js";

/** A rule a nudge group must pass. Check returns its problems, or none. */
export interface NudgeGroupRule {
  check(item: NudgeGroup): string[];
}

export class NudgeGroupScoreRangeRule implements NudgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeGroup): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeGroupNotesLengthRule implements NudgeGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeGroup): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeGroupClicksRangeRule implements NudgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeGroup): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeGroupRateRangeRule implements NudgeGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeGroup): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a nudge group. */
export class NudgeGroupValidator {
  rules: NudgeGroupRule[];

  constructor(rules: NudgeGroupRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeGroup[]): Map<string, string[]> {
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

export function defaultNudgeGroupValidator(): NudgeGroupValidator {
  return new NudgeGroupValidator(
    [
      new NudgeGroupScoreRangeRule(9.1, 2018.4),
      new NudgeGroupNotesLengthRule(32),
      new NudgeGroupClicksRangeRule(1000, 3600),
      new NudgeGroupRateRangeRule(4.6, 2958.1),
    ],
  );
}
