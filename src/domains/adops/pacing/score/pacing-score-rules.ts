import * as text from "../../../../kit/text.js";
import { PacingScore } from "./pacing-score.js";

/** A rule a pacing score must pass. Check returns its problems, or none. */
export interface PacingScoreRule {
  check(item: PacingScore): string[];
}

export class PacingScoreAllowedJourneyIdRule implements PacingScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is expired`];
    return [];
  }
}

export class PacingScoreBidRangeRule implements PacingScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingScore): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingScoreRequiredJourneyIdRule implements PacingScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingScore): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing score. */
export class PacingScoreValidator {
  rules: PacingScoreRule[];

  constructor(rules: PacingScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PacingScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingScore[]): Map<string, string[]> {
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

export function defaultPacingScoreValidator(): PacingScoreValidator {
  return new PacingScoreValidator(
    [
      new PacingScoreAllowedJourneyIdRule([]),
      new PacingScoreBidRangeRule(3.6, 3891),
      new PacingScoreRequiredJourneyIdRule("pacing score needs an entry"),
    ],
  );
}
