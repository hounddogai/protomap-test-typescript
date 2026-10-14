import { PendingSenderEntry } from "./pending-sender-entry.js";

/** A rule a pending sender entry must pass. Check returns its problems, or none. */
export interface PendingSenderEntryRule {
  check(item: PendingSenderEntry): string[];
}

export class PendingSenderEntryLabelLengthRule implements PendingSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSenderEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSenderEntryRequiredLabelRule implements PendingSenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSenderEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSenderEntryBidRangeRule implements PendingSenderEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSenderEntry): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingSenderEntryCreatedAtRangeRule implements PendingSenderEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSenderEntry): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSenderEntryRequiredTitleRule implements PendingSenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSenderEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSenderEntrySegmentLengthRule implements PendingSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSenderEntry): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending sender entry. */
export class PendingSenderEntryValidator {
  rules: PendingSenderEntryRule[];

  constructor(rules: PendingSenderEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSenderEntry): string[] {
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

  requireValid(item: PendingSenderEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSenderEntry[]): Map<string, string[]> {
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

export function defaultPendingSenderEntryValidator(): PendingSenderEntryValidator {
  return new PendingSenderEntryValidator(
    [
      new PendingSenderEntryLabelLengthRule(120),
      new PendingSenderEntryRequiredLabelRule("pending sender entry needs this field"),
      new PendingSenderEntryBidRangeRule(3.9, 305.5),
      new PendingSenderEntryCreatedAtRangeRule(80, 120),
      new PendingSenderEntryRequiredTitleRule("pending sender entry needs this field"),
      new PendingSenderEntrySegmentLengthRule(64),
    ],
  );
}
