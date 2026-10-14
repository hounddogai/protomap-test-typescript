import { FrequencyTier } from "./frequency-tier.js";

/** A rule a frequency tier must pass. Check returns its problems, or none. */
export interface FrequencyTierRule {
  check(item: FrequencyTier): string[];
}

export class FrequencyTierRequiredLabelRule implements FrequencyTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyTierApprovedGuardRule implements FrequencyTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FrequencyTier): string[] {
    if (item.approved && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FrequencyTierAmountRangeRule implements FrequencyTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyTier): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyTierTagsLimitRule implements FrequencyTierRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FrequencyTier): string[] {
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

/** Runs every rule of a frequency tier. */
export class FrequencyTierValidator {
  rules: FrequencyTierRule[];

  constructor(rules: FrequencyTierRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyTier): string[] {
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

  requireValid(item: FrequencyTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyTier[]): Map<string, string[]> {
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

export function defaultFrequencyTierValidator(): FrequencyTierValidator {
  return new FrequencyTierValidator(
    [
      new FrequencyTierRequiredLabelRule("frequency tier needs this field"),
      new FrequencyTierApprovedGuardRule(7),
      new FrequencyTierAmountRangeRule(1.2, 202.5),
      new FrequencyTierTagsLimitRule(1000, ["scheduled", "scheduled", "default"]),
    ],
  );
}
