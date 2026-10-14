import { ScheduledFlightScore } from "./scheduled-flight-score.js";

/** A rule a scheduled flight score must pass. Check returns its problems, or none. */
export interface ScheduledFlightScoreRule {
  check(item: ScheduledFlightScore): string[];
}

export class ScheduledFlightScoreRequiredTitleRule implements ScheduledFlightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFlightScoreRequiredCohortRule implements ScheduledFlightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightScore): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFlightScoreCodeLengthRule implements ScheduledFlightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFlightScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled flight score. */
export class ScheduledFlightScoreValidator {
  rules: ScheduledFlightScoreRule[];

  constructor(rules: ScheduledFlightScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFlightScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledFlightScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFlightScore[]): Map<string, string[]> {
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

export function defaultScheduledFlightScoreValidator(): ScheduledFlightScoreValidator {
  return new ScheduledFlightScoreValidator(
    [
      new ScheduledFlightScoreRequiredTitleRule("scheduled flight score needs a value"),
      new ScheduledFlightScoreRequiredCohortRule("scheduled flight score needs an entry"),
      new ScheduledFlightScoreCodeLengthRule(80),
    ],
  );
}
