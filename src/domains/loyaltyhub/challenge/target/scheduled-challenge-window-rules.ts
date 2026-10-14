import { ScheduledChallengeWindow } from "./scheduled-challenge-window.js";

/** A rule a scheduled challenge window must pass. Check returns its problems, or none. */
export interface ScheduledChallengeWindowRule {
  check(item: ScheduledChallengeWindow): string[];
}

export class ScheduledChallengeWindowCeilingRangeRule implements ScheduledChallengeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledChallengeWindow): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledChallengeWindowMarginRangeRule implements ScheduledChallengeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledChallengeWindow): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledChallengeWindowRequiredChannelRule implements ScheduledChallengeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledChallengeWindow): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledChallengeWindowRequiredCodeRule implements ScheduledChallengeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledChallengeWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled challenge window. */
export class ScheduledChallengeWindowValidator {
  rules: ScheduledChallengeWindowRule[];

  constructor(rules: ScheduledChallengeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledChallengeWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledChallengeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledChallengeWindow[]): Map<string, string[]> {
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

export function defaultScheduledChallengeWindowValidator(): ScheduledChallengeWindowValidator {
  return new ScheduledChallengeWindowValidator(
    [
      new ScheduledChallengeWindowCeilingRangeRule(3.5, 4313.6),
      new ScheduledChallengeWindowMarginRangeRule(7.6, 1520.2),
      new ScheduledChallengeWindowRequiredChannelRule("scheduled challenge window needs this field"),
      new ScheduledChallengeWindowRequiredCodeRule("scheduled challenge window needs a value"),
    ],
  );
}
