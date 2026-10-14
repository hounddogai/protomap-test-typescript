import * as text from "../../../../kit/text.js";
import { JourneyScore } from "./journey-score.js";

/** A rule a journey score must pass. Check returns its problems, or none. */
export interface JourneyScoreRule {
  check(item: JourneyScore): string[];
}

export class JourneyScoreRequiredCodeRule implements JourneyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyScoreRequiredCountryRule implements JourneyScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyScore): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyScoreScoreRangeRule implements JourneyScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyScore): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyScoreAllowedSourceRule implements JourneyScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is unknown`];
    return [];
  }
}

/** Runs every rule of a journey score. */
export class JourneyScoreValidator {
  rules: JourneyScoreRule[];

  constructor(rules: JourneyScoreRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyScore): string[] {
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

  requireValid(item: JourneyScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyScore[]): Map<string, string[]> {
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

export function defaultJourneyScoreValidator(): JourneyScoreValidator {
  return new JourneyScoreValidator(
    [
      new JourneyScoreRequiredCodeRule("journey score needs an entry"),
      new JourneyScoreRequiredCountryRule("journey score needs an entry"),
      new JourneyScoreScoreRangeRule(9.5, 3296.7),
      new JourneyScoreAllowedSourceRule(["primary", "tiered", "scheduled"]),
    ],
  );
}
