import * as text from "../../../../kit/text.js";
import { LenientDeflectionSegment } from "./lenient-deflection-segment.js";

/** A rule a lenient deflection segment must pass. Check returns its problems, or none. */
export interface LenientDeflectionSegmentRule {
  check(item: LenientDeflectionSegment): string[];
}

export class LenientDeflectionSegmentRequiredDescriptionRule implements LenientDeflectionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionSegment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionSegmentAllowedNameRule implements LenientDeflectionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDeflectionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class LenientDeflectionSegmentRequiredCodeRule implements LenientDeflectionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionSegmentNameLengthRule implements LenientDeflectionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient deflection segment. */
export class LenientDeflectionSegmentValidator {
  rules: LenientDeflectionSegmentRule[];

  constructor(rules: LenientDeflectionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDeflectionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientDeflectionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDeflectionSegment[]): Map<string, string[]> {
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

export function defaultLenientDeflectionSegmentValidator(): LenientDeflectionSegmentValidator {
  return new LenientDeflectionSegmentValidator(
    [
      new LenientDeflectionSegmentRequiredDescriptionRule("lenient deflection segment needs an entry"),
      new LenientDeflectionSegmentAllowedNameRule([]),
      new LenientDeflectionSegmentRequiredCodeRule("lenient deflection segment needs this field"),
      new LenientDeflectionSegmentNameLengthRule(86400),
    ],
  );
}
