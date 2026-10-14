import { DeflectionSegment } from "./deflection-segment.js";

/** A rule a deflection segment must pass. Check returns its problems, or none. */
export interface DeflectionSegmentRule {
  check(item: DeflectionSegment): string[];
}

export class DeflectionSegmentApprovedGuardRule implements DeflectionSegmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionSegment): string[] {
    if (item.approved && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class DeflectionSegmentMinimumRangeRule implements DeflectionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionSegment): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionSegmentDiscountRangeRule implements DeflectionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionSegment): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionSegmentRequiredNameRule implements DeflectionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionSegmentExpiresAtRangeRule implements DeflectionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionSegment): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionSegmentCodePrefixRule implements DeflectionSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a deflection segment. */
export class DeflectionSegmentValidator {
  rules: DeflectionSegmentRule[];

  constructor(rules: DeflectionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionSegment[]): Map<string, string[]> {
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

export function defaultDeflectionSegmentValidator(): DeflectionSegmentValidator {
  return new DeflectionSegmentValidator(
    [
      new DeflectionSegmentApprovedGuardRule(3.1),
      new DeflectionSegmentMinimumRangeRule(5.2, 910.2),
      new DeflectionSegmentDiscountRangeRule(1.7, 3216.9),
      new DeflectionSegmentRequiredNameRule("deflection segment needs an entry"),
      new DeflectionSegmentExpiresAtRangeRule(64, 1000),
      new DeflectionSegmentCodePrefixRule("X"),
    ],
  );
}
