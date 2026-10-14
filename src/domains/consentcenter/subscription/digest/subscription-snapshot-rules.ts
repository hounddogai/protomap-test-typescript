import { SubscriptionSnapshot } from "./subscription-snapshot.js";

/** A rule a subscription snapshot must pass. Check returns its problems, or none. */
export interface SubscriptionSnapshotRule {
  check(item: SubscriptionSnapshot): string[];
}

export class SubscriptionSnapshotRequiredChecksumRule implements SubscriptionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionSnapshot): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionSnapshotRequiredJourneyIdRule implements SubscriptionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionSnapshot): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionSnapshotWindowDaysRangeRule implements SubscriptionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionSnapshot): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a subscription snapshot. */
export class SubscriptionSnapshotValidator {
  rules: SubscriptionSnapshotRule[];

  constructor(rules: SubscriptionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionSnapshot): string[] {
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

  requireValid(item: SubscriptionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionSnapshot[]): Map<string, string[]> {
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

export function defaultSubscriptionSnapshotValidator(): SubscriptionSnapshotValidator {
  return new SubscriptionSnapshotValidator(
    [
      new SubscriptionSnapshotRequiredChecksumRule("subscription snapshot needs an entry"),
      new SubscriptionSnapshotRequiredJourneyIdRule("subscription snapshot needs this field"),
      new SubscriptionSnapshotWindowDaysRangeRule(120, 1000),
    ],
  );
}
