import { NudgeWindow } from "./nudge-window.js";

/** A rule a nudge window must pass. Check returns its problems, or none. */
export interface NudgeWindowRule {
  check(item: NudgeWindow): string[];
}

export class NudgeWindowSegmentLengthRule implements NudgeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeWindow): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeWindowRequiredTitleRule implements NudgeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeWindowClicksRangeRule implements NudgeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeWindow): string[] {
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

/** Runs every rule of a nudge window. */
export class NudgeWindowValidator {
  rules: NudgeWindowRule[];

  constructor(rules: NudgeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeWindow[]): Map<string, string[]> {
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

export function defaultNudgeWindowValidator(): NudgeWindowValidator {
  return new NudgeWindowValidator(
    [
      new NudgeWindowSegmentLengthRule(1000),
      new NudgeWindowRequiredTitleRule("nudge window needs this field"),
      new NudgeWindowClicksRangeRule(80, 80),
    ],
  );
}
