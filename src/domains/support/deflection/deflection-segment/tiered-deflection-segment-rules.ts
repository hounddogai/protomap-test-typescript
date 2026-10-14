import * as text from "../../../../kit/text.js";
import { TieredDeflectionSegment } from "./tiered-deflection-segment.js";

/** A rule a tiered deflection segment must pass. Check returns its problems, or none. */
export interface TieredDeflectionSegmentRule {
  check(item: TieredDeflectionSegment): string[];
}

export class TieredDeflectionSegmentCodeLengthRule implements TieredDeflectionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionSegmentAllowedNameRule implements TieredDeflectionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredDeflectionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class TieredDeflectionSegmentRequiredCodeRule implements TieredDeflectionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDeflectionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered deflection segment. */
export class TieredDeflectionSegmentValidator {
  rules: TieredDeflectionSegmentRule[];

  constructor(rules: TieredDeflectionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDeflectionSegment): string[] {
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

  requireValid(item: TieredDeflectionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDeflectionSegment[]): Map<string, string[]> {
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

export function defaultTieredDeflectionSegmentValidator(): TieredDeflectionSegmentValidator {
  return new TieredDeflectionSegmentValidator(
    [
      new TieredDeflectionSegmentCodeLengthRule(16),
      new TieredDeflectionSegmentAllowedNameRule([]),
      new TieredDeflectionSegmentRequiredCodeRule("tiered deflection segment needs this field"),
    ],
  );
}
