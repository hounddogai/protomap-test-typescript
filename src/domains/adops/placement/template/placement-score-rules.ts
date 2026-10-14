import * as text from "../../../../kit/text.js";
import { PlacementScore } from "./placement-score.js";

/** A rule a placement score must pass. Check returns its problems, or none. */
export interface PlacementScoreRule {
  check(item: PlacementScore): string[];
}

export class PlacementScoreRequiredSourceRule implements PlacementScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementScore): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementScoreApprovedGuardRule implements PlacementScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementScore): string[] {
    if (item.approved && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PlacementScoreRequiredChannelRule implements PlacementScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementScore): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementScoreAllowedCategoryRule implements PlacementScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is not allowed`];
    return [];
  }
}

/** Runs every rule of a placement score. */
export class PlacementScoreValidator {
  rules: PlacementScoreRule[];

  constructor(rules: PlacementScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementScore[]): Map<string, string[]> {
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

export function defaultPlacementScoreValidator(): PlacementScoreValidator {
  return new PlacementScoreValidator(
    [
      new PlacementScoreRequiredSourceRule("placement score needs this field"),
      new PlacementScoreApprovedGuardRule(32),
      new PlacementScoreRequiredChannelRule("placement score needs an entry"),
      new PlacementScoreAllowedCategoryRule(["manual", "regional", "strict"]),
    ],
  );
}
