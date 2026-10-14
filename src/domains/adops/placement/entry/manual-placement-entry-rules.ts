import { ManualPlacementEntry } from "./manual-placement-entry.js";

/** A rule a manual placement entry must pass. Check returns its problems, or none. */
export interface ManualPlacementEntryRule {
  check(item: ManualPlacementEntry): string[];
}

export class ManualPlacementEntryVersionRangeRule implements ManualPlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPlacementEntry): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPlacementEntrySegmentLengthRule implements ManualPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPlacementEntry): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPlacementEntryOpenRateRangeRule implements ManualPlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPlacementEntry): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPlacementEntryGraceDaysRangeRule implements ManualPlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPlacementEntry): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualPlacementEntryTitleLengthRule implements ManualPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPlacementEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPlacementEntryRequiredTitleRule implements ManualPlacementEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPlacementEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual placement entry. */
export class ManualPlacementEntryValidator {
  rules: ManualPlacementEntryRule[];

  constructor(rules: ManualPlacementEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPlacementEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPlacementEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPlacementEntry[]): Map<string, string[]> {
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

export function defaultManualPlacementEntryValidator(): ManualPlacementEntryValidator {
  return new ManualPlacementEntryValidator(
    [
      new ManualPlacementEntryVersionRangeRule(16, 16),
      new ManualPlacementEntrySegmentLengthRule(32),
      new ManualPlacementEntryOpenRateRangeRule(4, 3134.2),
      new ManualPlacementEntryGraceDaysRangeRule(1000, 86400),
      new ManualPlacementEntryTitleLengthRule(3600),
      new ManualPlacementEntryRequiredTitleRule("manual placement entry needs this field"),
    ],
  );
}
