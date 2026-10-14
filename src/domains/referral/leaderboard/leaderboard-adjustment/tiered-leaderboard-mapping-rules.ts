import * as text from "../../../../kit/text.js";
import { TieredLeaderboardMapping } from "./tiered-leaderboard-mapping.js";

/** A rule a tiered leaderboard mapping must pass. Check returns its problems, or none. */
export interface TieredLeaderboardMappingRule {
  check(item: TieredLeaderboardMapping): string[];
}

export class TieredLeaderboardMappingCodeLengthRule implements TieredLeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLeaderboardMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLeaderboardMappingAllowedCodeRule implements TieredLeaderboardMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredLeaderboardMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class TieredLeaderboardMappingSequenceRangeRule implements TieredLeaderboardMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLeaderboardMapping): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredLeaderboardMappingRequiredLabelRule implements TieredLeaderboardMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLeaderboardMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered leaderboard mapping. */
export class TieredLeaderboardMappingValidator {
  rules: TieredLeaderboardMappingRule[];

  constructor(rules: TieredLeaderboardMappingRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLeaderboardMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredLeaderboardMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLeaderboardMapping[]): Map<string, string[]> {
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

export function defaultTieredLeaderboardMappingValidator(): TieredLeaderboardMappingValidator {
  return new TieredLeaderboardMappingValidator(
    [
      new TieredLeaderboardMappingCodeLengthRule(3600),
      new TieredLeaderboardMappingAllowedCodeRule(["scheduled", "default"]),
      new TieredLeaderboardMappingSequenceRangeRule(255, 1000),
      new TieredLeaderboardMappingRequiredLabelRule("tiered leaderboard mapping needs this field"),
    ],
  );
}
