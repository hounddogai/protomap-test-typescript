import { SeasonalRewardEntry } from "./seasonal-reward-entry.js";

/** A rule a seasonal reward entry must pass. Check returns its problems, or none. */
export interface SeasonalRewardEntryRule {
  check(item: SeasonalRewardEntry): string[];
}

export class SeasonalRewardEntryQuantityRangeRule implements SeasonalRewardEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRewardEntry): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalRewardEntryAudienceIdLengthRule implements SeasonalRewardEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardEntry): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalRewardEntryVisibleGuardRule implements SeasonalRewardEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SeasonalRewardEntry): string[] {
    if (item.visible && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SeasonalRewardEntryRequiredAudienceIdRule implements SeasonalRewardEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRewardEntry): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal reward entry. */
export class SeasonalRewardEntryValidator {
  rules: SeasonalRewardEntryRule[];

  constructor(rules: SeasonalRewardEntryRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRewardEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalRewardEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRewardEntry[]): Map<string, string[]> {
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

export function defaultSeasonalRewardEntryValidator(): SeasonalRewardEntryValidator {
  return new SeasonalRewardEntryValidator(
    [
      new SeasonalRewardEntryQuantityRangeRule(32, 64),
      new SeasonalRewardEntryAudienceIdLengthRule(80),
      new SeasonalRewardEntryVisibleGuardRule(1000),
      new SeasonalRewardEntryRequiredAudienceIdRule("seasonal reward entry needs an entry"),
    ],
  );
}
