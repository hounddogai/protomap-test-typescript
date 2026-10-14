import * as text from "../../../../kit/text.js";
import { TieredStepSegment } from "./tiered-step-segment.js";

/** A rule a tiered step segment must pass. Check returns its problems, or none. */
export interface TieredStepSegmentRule {
  check(item: TieredStepSegment): string[];
}

export class TieredStepSegmentFrequencyCapRangeRule implements TieredStepSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStepSegment): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredStepSegmentCodePrefixRule implements TieredStepSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredStepSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredStepSegmentNameLengthRule implements TieredStepSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStepSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStepSegmentAllowedNameRule implements TieredStepSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredStepSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a tiered step segment. */
export class TieredStepSegmentValidator {
  rules: TieredStepSegmentRule[];

  constructor(rules: TieredStepSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredStepSegment): string[] {
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

  requireValid(item: TieredStepSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredStepSegment[]): Map<string, string[]> {
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

export function defaultTieredStepSegmentValidator(): TieredStepSegmentValidator {
  return new TieredStepSegmentValidator(
    [
      new TieredStepSegmentFrequencyCapRangeRule(64, 120),
      new TieredStepSegmentCodePrefixRule("Q"),
      new TieredStepSegmentNameLengthRule(3600),
      new TieredStepSegmentAllowedNameRule([]),
    ],
  );
}
