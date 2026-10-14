import { MentionTier } from "./mention-tier.js";

/** A rule a mention tier must pass. Check returns its problems, or none. */
export interface MentionTierRule {
  check(item: MentionTier): string[];
}

export class MentionTierAmountRangeRule implements MentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionTier): string[] {
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

export class MentionTierRequiredLabelRule implements MentionTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MentionTierRetriesRangeRule implements MentionTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionTier): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a mention tier. */
export class MentionTierValidator {
  rules: MentionTierRule[];

  constructor(rules: MentionTierRule[]) {
    this.rules = rules;
  }

  validate(item: MentionTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionTier[]): Map<string, string[]> {
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

export function defaultMentionTierValidator(): MentionTierValidator {
  return new MentionTierValidator(
    [
      new MentionTierAmountRangeRule(7.5, 4597.3),
      new MentionTierRequiredLabelRule("mention tier needs this field"),
      new MentionTierRetriesRangeRule(80, 255),
    ],
  );
}
