import * as text from "../../../../kit/text.js";
import { FallbackDeflectionSegment } from "./fallback-deflection-segment.js";

/** A rule a fallback deflection segment must pass. Check returns its problems, or none. */
export interface FallbackDeflectionSegmentRule {
  check(item: FallbackDeflectionSegment): string[];
}

export class FallbackDeflectionSegmentRequiredPhoneRule implements FallbackDeflectionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDeflectionSegment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackDeflectionSegmentDurationMinutesRangeRule implements FallbackDeflectionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackDeflectionSegment): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackDeflectionSegmentAllowedContactEmailRule implements FallbackDeflectionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackDeflectionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is not allowed`];
    return [];
  }
}

export class FallbackDeflectionSegmentRequiredNameRule implements FallbackDeflectionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDeflectionSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback deflection segment. */
export class FallbackDeflectionSegmentValidator {
  rules: FallbackDeflectionSegmentRule[];

  constructor(rules: FallbackDeflectionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackDeflectionSegment): string[] {
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

  requireValid(item: FallbackDeflectionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackDeflectionSegment[]): Map<string, string[]> {
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

export function defaultFallbackDeflectionSegmentValidator(): FallbackDeflectionSegmentValidator {
  return new FallbackDeflectionSegmentValidator(
    [
      new FallbackDeflectionSegmentRequiredPhoneRule("fallback deflection segment needs this field"),
      new FallbackDeflectionSegmentDurationMinutesRangeRule(32, 80),
      new FallbackDeflectionSegmentAllowedContactEmailRule(["seasonal", "fallback", "adaptive"]),
      new FallbackDeflectionSegmentRequiredNameRule("fallback deflection segment needs this field"),
    ],
  );
}
