import { PendingFrequencyTarget } from "./pending-frequency-target.js";

/** A rule a pending frequency target must pass. Check returns its problems, or none. */
export interface PendingFrequencyTargetRule {
  check(item: PendingFrequencyTarget): string[];
}

export class PendingFrequencyTargetCodePrefixRule implements PendingFrequencyTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingFrequencyTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingFrequencyTargetRequiredTitleRule implements PendingFrequencyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFrequencyTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFrequencyTargetApprovedGuardRule implements PendingFrequencyTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingFrequencyTarget): string[] {
    if (item.approved && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PendingFrequencyTargetMarginRangeRule implements PendingFrequencyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFrequencyTarget): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingFrequencyTargetTitleLengthRule implements PendingFrequencyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyTargetSegmentLengthRule implements PendingFrequencyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyTarget): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending frequency target. */
export class PendingFrequencyTargetValidator {
  rules: PendingFrequencyTargetRule[];

  constructor(rules: PendingFrequencyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFrequencyTarget): string[] {
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

  requireValid(item: PendingFrequencyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFrequencyTarget[]): Map<string, string[]> {
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

export function defaultPendingFrequencyTargetValidator(): PendingFrequencyTargetValidator {
  return new PendingFrequencyTargetValidator(
    [
      new PendingFrequencyTargetCodePrefixRule("REF"),
      new PendingFrequencyTargetRequiredTitleRule("pending frequency target needs an entry"),
      new PendingFrequencyTargetApprovedGuardRule(4.9),
      new PendingFrequencyTargetMarginRangeRule(5.7, 455.8),
      new PendingFrequencyTargetTitleLengthRule(255),
      new PendingFrequencyTargetSegmentLengthRule(255),
    ],
  );
}
