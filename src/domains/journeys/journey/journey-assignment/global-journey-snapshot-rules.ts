import { GlobalJourneySnapshot } from "./global-journey-snapshot.js";

/** A rule a global journey snapshot must pass. Check returns its problems, or none. */
export interface GlobalJourneySnapshotRule {
  check(item: GlobalJourneySnapshot): string[];
}

export class GlobalJourneySnapshotCurrencyLengthRule implements GlobalJourneySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneySnapshot): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalJourneySnapshotCodePrefixRule implements GlobalJourneySnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalJourneySnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalJourneySnapshotSequenceRangeRule implements GlobalJourneySnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalJourneySnapshot): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalJourneySnapshotTitleLengthRule implements GlobalJourneySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneySnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalJourneySnapshotCategoryLengthRule implements GlobalJourneySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneySnapshot): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global journey snapshot. */
export class GlobalJourneySnapshotValidator {
  rules: GlobalJourneySnapshotRule[];

  constructor(rules: GlobalJourneySnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalJourneySnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalJourneySnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalJourneySnapshot[]): Map<string, string[]> {
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

export function defaultGlobalJourneySnapshotValidator(): GlobalJourneySnapshotValidator {
  return new GlobalJourneySnapshotValidator(
    [
      new GlobalJourneySnapshotCurrencyLengthRule(16),
      new GlobalJourneySnapshotCodePrefixRule("ACM"),
      new GlobalJourneySnapshotSequenceRangeRule(80, 255),
      new GlobalJourneySnapshotTitleLengthRule(120),
      new GlobalJourneySnapshotCategoryLengthRule(16),
    ],
  );
}
