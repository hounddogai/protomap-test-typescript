import { StrictReputationTier } from "./strict-reputation-tier.js";

/** A rule a strict reputation tier must pass. Check returns its problems, or none. */
export interface StrictReputationTierRule {
  check(item: StrictReputationTier): string[];
}

export class StrictReputationTierTagsLimitRule implements StrictReputationTierRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: StrictReputationTier): string[] {
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

export class StrictReputationTierRequiredReviewerRule implements StrictReputationTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationTier): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class StrictReputationTierStartsAtRangeRule implements StrictReputationTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReputationTier): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReputationTierBudgetRangeRule implements StrictReputationTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictReputationTier): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictReputationTierReviewerLengthRule implements StrictReputationTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictReputationTier): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict reputation tier. */
export class StrictReputationTierValidator {
  rules: StrictReputationTierRule[];

  constructor(rules: StrictReputationTierRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReputationTier): string[] {
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

  requireValid(item: StrictReputationTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReputationTier[]): Map<string, string[]> {
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

export function defaultStrictReputationTierValidator(): StrictReputationTierValidator {
  return new StrictReputationTierValidator(
    [
      new StrictReputationTierTagsLimitRule(255, ["manual", "strict", "lenient"]),
      new StrictReputationTierRequiredReviewerRule("strict reputation tier needs an entry"),
      new StrictReputationTierStartsAtRangeRule(32, 86400),
      new StrictReputationTierBudgetRangeRule(7.5, 2765.6),
      new StrictReputationTierReviewerLengthRule(16),
    ],
  );
}
