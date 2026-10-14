import * as text from "../../../../kit/text.js";
import { PrimaryTierSegment } from "./primary-tier-segment.js";

/** A rule a primary tier segment must pass. Check returns its problems, or none. */
export interface PrimaryTierSegmentRule {
  check(item: PrimaryTierSegment): string[];
}

export class PrimaryTierSegmentRequiredNameRule implements PrimaryTierSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTierSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTierSegmentBudgetRangeRule implements PrimaryTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTierSegment): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryTierSegmentAllowedNameRule implements PrimaryTierSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryTierSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class PrimaryTierSegmentCodeLengthRule implements PrimaryTierSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTierSegmentRequiredCodeRule implements PrimaryTierSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTierSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTierSegmentStartsAtRangeRule implements PrimaryTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTierSegment): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary tier segment. */
export class PrimaryTierSegmentValidator {
  rules: PrimaryTierSegmentRule[];

  constructor(rules: PrimaryTierSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTierSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTierSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTierSegment[]): Map<string, string[]> {
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

export function defaultPrimaryTierSegmentValidator(): PrimaryTierSegmentValidator {
  return new PrimaryTierSegmentValidator(
    [
      new PrimaryTierSegmentRequiredNameRule("primary tier segment needs a value"),
      new PrimaryTierSegmentBudgetRangeRule(7.7, 1259.2),
      new PrimaryTierSegmentAllowedNameRule(["capped", "tiered"]),
      new PrimaryTierSegmentCodeLengthRule(86400),
      new PrimaryTierSegmentRequiredCodeRule("primary tier segment needs an entry"),
      new PrimaryTierSegmentStartsAtRangeRule(64, 1000),
    ],
  );
}
