import { PlacementEntry } from "./placement-entry.js";

/** A rule a placement entry must pass. Check returns its problems, or none. */
export interface PlacementEntryRule {
  check(item: PlacementEntry): string[];
}

export class PlacementEntryRequiredTitleRule implements PlacementEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementEntryGraceDaysRangeRule implements PlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementEntry): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementEntryChannelLengthRule implements PlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementEntry): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementEntryPinnedGuardRule implements PlacementEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementEntry): string[] {
    if (item.pinned && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class PlacementEntryClicksRangeRule implements PlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementEntry): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement entry. */
export class PlacementEntryValidator {
  rules: PlacementEntryRule[];

  constructor(rules: PlacementEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementEntry[]): Map<string, string[]> {
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

export function defaultPlacementEntryValidator(): PlacementEntryValidator {
  return new PlacementEntryValidator(
    [
      new PlacementEntryRequiredTitleRule("placement entry needs this field"),
      new PlacementEntryGraceDaysRangeRule(32, 86400),
      new PlacementEntryChannelLengthRule(3600),
      new PlacementEntryPinnedGuardRule(1000),
      new PlacementEntryClicksRangeRule(64, 3600),
    ],
  );
}
