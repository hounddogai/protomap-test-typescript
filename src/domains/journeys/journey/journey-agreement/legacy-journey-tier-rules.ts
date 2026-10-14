import { LegacyJourneyTier } from "./legacy-journey-tier.js";

/** A rule a legacy journey tier must pass. Check returns its problems, or none. */
export interface LegacyJourneyTierRule {
  check(item: LegacyJourneyTier): string[];
}

export class LegacyJourneyTierApprovedGuardRule implements LegacyJourneyTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyJourneyTier): string[] {
    if (item.approved && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LegacyJourneyTierRequiredCodeRule implements LegacyJourneyTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyJourneyTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyJourneyTierRequiredTitleRule implements LegacyJourneyTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyJourneyTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyJourneyTierSendAtRangeRule implements LegacyJourneyTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyJourneyTier): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyJourneyTierRequiredLabelRule implements LegacyJourneyTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyJourneyTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy journey tier. */
export class LegacyJourneyTierValidator {
  rules: LegacyJourneyTierRule[];

  constructor(rules: LegacyJourneyTierRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyJourneyTier): string[] {
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

  requireValid(item: LegacyJourneyTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyJourneyTier[]): Map<string, string[]> {
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

export function defaultLegacyJourneyTierValidator(): LegacyJourneyTierValidator {
  return new LegacyJourneyTierValidator(
    [
      new LegacyJourneyTierApprovedGuardRule(8.8),
      new LegacyJourneyTierRequiredCodeRule("legacy journey tier needs an entry"),
      new LegacyJourneyTierRequiredTitleRule("legacy journey tier needs this field"),
      new LegacyJourneyTierSendAtRangeRule(64, 120),
      new LegacyJourneyTierRequiredLabelRule("legacy journey tier needs a value"),
    ],
  );
}
