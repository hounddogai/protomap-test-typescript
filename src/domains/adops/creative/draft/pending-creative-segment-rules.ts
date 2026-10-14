import { PendingCreativeSegment } from "./pending-creative-segment.js";

/** A rule a pending creative segment must pass. Check returns its problems, or none. */
export interface PendingCreativeSegmentRule {
  check(item: PendingCreativeSegment): string[];
}

export class PendingCreativeSegmentExpiresAtRangeRule implements PendingCreativeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCreativeSegment): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCreativeSegmentVisibleGuardRule implements PendingCreativeSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingCreativeSegment): string[] {
    if (item.visible && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PendingCreativeSegmentRequiredTitleRule implements PendingCreativeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending creative segment. */
export class PendingCreativeSegmentValidator {
  rules: PendingCreativeSegmentRule[];

  constructor(rules: PendingCreativeSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreativeSegment): string[] {
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

  requireValid(item: PendingCreativeSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreativeSegment[]): Map<string, string[]> {
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

export function defaultPendingCreativeSegmentValidator(): PendingCreativeSegmentValidator {
  return new PendingCreativeSegmentValidator(
    [
      new PendingCreativeSegmentExpiresAtRangeRule(32, 255),
      new PendingCreativeSegmentVisibleGuardRule(8.9),
      new PendingCreativeSegmentRequiredTitleRule("pending creative segment needs a value"),
    ],
  );
}
