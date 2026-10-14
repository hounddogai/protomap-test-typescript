import { CappedProofTier } from "./capped-proof-tier.js";

/** A rule a capped proof tier must pass. Check returns its problems, or none. */
export interface CappedProofTierRule {
  check(item: CappedProofTier): string[];
}

export class CappedProofTierReviewerLengthRule implements CappedProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedProofTier): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedProofTierArchivedGuardRule implements CappedProofTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedProofTier): string[] {
    if (item.archived && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class CappedProofTierRequiredReviewerRule implements CappedProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedProofTier): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class CappedProofTierPriorityRangeRule implements CappedProofTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedProofTier): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedProofTierRequiredTitleRule implements CappedProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedProofTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped proof tier. */
export class CappedProofTierValidator {
  rules: CappedProofTierRule[];

  constructor(rules: CappedProofTierRule[]) {
    this.rules = rules;
  }

  validate(item: CappedProofTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedProofTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedProofTier[]): Map<string, string[]> {
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

export function defaultCappedProofTierValidator(): CappedProofTierValidator {
  return new CappedProofTierValidator(
    [
      new CappedProofTierReviewerLengthRule(64),
      new CappedProofTierArchivedGuardRule(4.2),
      new CappedProofTierRequiredReviewerRule("capped proof tier needs an entry"),
      new CappedProofTierPriorityRangeRule(32, 86400),
      new CappedProofTierRequiredTitleRule("capped proof tier needs an entry"),
    ],
  );
}
