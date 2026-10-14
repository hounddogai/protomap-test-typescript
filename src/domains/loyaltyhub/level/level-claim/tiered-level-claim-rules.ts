import * as text from "../../../../kit/text.js";
import { TieredLevelClaim } from "./tiered-level-claim.js";

/** A rule a tiered level claim must pass. Check returns its problems, or none. */
export interface TieredLevelClaimRule {
  check(item: TieredLevelClaim): string[];
}

export class TieredLevelClaimAllowedCodeRule implements TieredLevelClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredLevelClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class TieredLevelClaimRequiredCodeRule implements TieredLevelClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLevelClaimCostRangeRule implements TieredLevelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLevelClaim): string[] {
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

export class TieredLevelClaimAttemptsRangeRule implements TieredLevelClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLevelClaim): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredLevelClaimRequiredTitleRule implements TieredLevelClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLevelClaimTagsLimitRule implements TieredLevelClaimRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TieredLevelClaim): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

/** Runs every rule of a tiered level claim. */
export class TieredLevelClaimValidator {
  rules: TieredLevelClaimRule[];

  constructor(rules: TieredLevelClaimRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLevelClaim): string[] {
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

  requireValid(item: TieredLevelClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLevelClaim[]): Map<string, string[]> {
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

export function defaultTieredLevelClaimValidator(): TieredLevelClaimValidator {
  return new TieredLevelClaimValidator(
    [
      new TieredLevelClaimAllowedCodeRule(["batched", "manual", "pending"]),
      new TieredLevelClaimRequiredCodeRule("tiered level claim needs an entry"),
      new TieredLevelClaimCostRangeRule(3.8, 4563.9),
      new TieredLevelClaimAttemptsRangeRule(32, 64),
      new TieredLevelClaimRequiredTitleRule("tiered level claim needs a value"),
      new TieredLevelClaimTagsLimitRule(16, ["batched"]),
    ],
  );
}
