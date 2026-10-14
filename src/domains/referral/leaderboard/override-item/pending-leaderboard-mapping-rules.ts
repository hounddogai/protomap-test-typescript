import { PendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

/** A rule a pending leaderboard mapping must pass. Check returns its problems, or none. */
export interface PendingLeaderboardMappingRule {
  check(item: PendingLeaderboardMapping): string[];
}

export class PendingLeaderboardMappingCodeLengthRule implements PendingLeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardMappingCostRangeRule implements PendingLeaderboardMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLeaderboardMapping): string[] {
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

export class PendingLeaderboardMappingRequiredCohortRule implements PendingLeaderboardMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLeaderboardMapping): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLeaderboardMappingCohortLengthRule implements PendingLeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardMapping): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardMappingNameLengthRule implements PendingLeaderboardMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLeaderboardMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLeaderboardMappingCodePrefixRule implements PendingLeaderboardMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingLeaderboardMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending leaderboard mapping. */
export class PendingLeaderboardMappingValidator {
  rules: PendingLeaderboardMappingRule[];

  constructor(rules: PendingLeaderboardMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLeaderboardMapping): string[] {
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

  requireValid(item: PendingLeaderboardMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLeaderboardMapping[]): Map<string, string[]> {
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

export function defaultPendingLeaderboardMappingValidator(): PendingLeaderboardMappingValidator {
  return new PendingLeaderboardMappingValidator(
    [
      new PendingLeaderboardMappingCodeLengthRule(120),
      new PendingLeaderboardMappingCostRangeRule(9.6, 4915.4),
      new PendingLeaderboardMappingRequiredCohortRule("pending leaderboard mapping needs a value"),
      new PendingLeaderboardMappingCohortLengthRule(120),
      new PendingLeaderboardMappingNameLengthRule(255),
      new PendingLeaderboardMappingCodePrefixRule("REF"),
    ],
  );
}
