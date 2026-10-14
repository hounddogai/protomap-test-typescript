import * as text from "../../../../kit/text.js";
import { TieredLeaderboardTemplate } from "./tiered-leaderboard-template.js";

/** A rule a tiered leaderboard template must pass. Check returns its problems, or none. */
export interface TieredLeaderboardTemplateRule {
  check(item: TieredLeaderboardTemplate): string[];
}

export class TieredLeaderboardTemplateSegmentLengthRule implements TieredLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLeaderboardTemplate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLeaderboardTemplateCodePrefixRule implements TieredLeaderboardTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredLeaderboardTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredLeaderboardTemplateOwnerIdLengthRule implements TieredLeaderboardTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLeaderboardTemplate): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLeaderboardTemplateRevisionRangeRule implements TieredLeaderboardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLeaderboardTemplate): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredLeaderboardTemplateEndsAtRangeRule implements TieredLeaderboardTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLeaderboardTemplate): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredLeaderboardTemplateAllowedCodeRule implements TieredLeaderboardTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredLeaderboardTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a tiered leaderboard template. */
export class TieredLeaderboardTemplateValidator {
  rules: TieredLeaderboardTemplateRule[];

  constructor(rules: TieredLeaderboardTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLeaderboardTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredLeaderboardTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLeaderboardTemplate[]): Map<string, string[]> {
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

export function defaultTieredLeaderboardTemplateValidator(): TieredLeaderboardTemplateValidator {
  return new TieredLeaderboardTemplateValidator(
    [
      new TieredLeaderboardTemplateSegmentLengthRule(120),
      new TieredLeaderboardTemplateCodePrefixRule("X"),
      new TieredLeaderboardTemplateOwnerIdLengthRule(120),
      new TieredLeaderboardTemplateRevisionRangeRule(120, 255),
      new TieredLeaderboardTemplateEndsAtRangeRule(120, 1000),
      new TieredLeaderboardTemplateAllowedCodeRule(["legacy", "weighted", "rolling"]),
    ],
  );
}
