import { ManualTicketViewTier } from "./manual-ticket-view-tier.js";

/** A rule a manual ticket view tier must pass. Check returns its problems, or none. */
export interface ManualTicketViewTierRule {
  check(item: ManualTicketViewTier): string[];
}

export class ManualTicketViewTierRequiredNameRule implements ManualTicketViewTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTicketViewTierTagsLimitRule implements ManualTicketViewTierRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ManualTicketViewTier): string[] {
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

export class ManualTicketViewTierEndsAtRangeRule implements ManualTicketViewTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualTicketViewTier): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualTicketViewTierCohortLengthRule implements ManualTicketViewTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTicketViewTier): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTicketViewTierRequiredCohortRule implements ManualTicketViewTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTicketViewTier): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual ticket view tier. */
export class ManualTicketViewTierValidator {
  rules: ManualTicketViewTierRule[];

  constructor(rules: ManualTicketViewTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTicketViewTier): string[] {
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

  requireValid(item: ManualTicketViewTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTicketViewTier[]): Map<string, string[]> {
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

export function defaultManualTicketViewTierValidator(): ManualTicketViewTierValidator {
  return new ManualTicketViewTierValidator(
    [
      new ManualTicketViewTierRequiredNameRule("manual ticket view tier needs a value"),
      new ManualTicketViewTierTagsLimitRule(32, []),
      new ManualTicketViewTierEndsAtRangeRule(32, 32),
      new ManualTicketViewTierCohortLengthRule(16),
      new ManualTicketViewTierRequiredCohortRule("manual ticket view tier needs an entry"),
    ],
  );
}
