import * as text from "../../../../kit/text.js";
import { OptOutSegment } from "./opt-out-segment.js";

/** A rule a opt out segment must pass. Check returns its problems, or none. */
export interface OptOutSegmentRule {
  check(item: OptOutSegment): string[];
}

export class OptOutSegmentContactEmailLengthRule implements OptOutSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutSegment): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutSegmentRequiredTitleRule implements OptOutSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutSegmentAllowedCodeRule implements OptOutSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class OptOutSegmentCeilingRangeRule implements OptOutSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutSegment): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutSegmentCohortLengthRule implements OptOutSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutSegment): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutSegmentRequiredContactEmailRule implements OptOutSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutSegment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out segment. */
export class OptOutSegmentValidator {
  rules: OptOutSegmentRule[];

  constructor(rules: OptOutSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutSegment[]): Map<string, string[]> {
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

export function defaultOptOutSegmentValidator(): OptOutSegmentValidator {
  return new OptOutSegmentValidator(
    [
      new OptOutSegmentContactEmailLengthRule(120),
      new OptOutSegmentRequiredTitleRule("opt out segment needs an entry"),
      new OptOutSegmentAllowedCodeRule(["rolling"]),
      new OptOutSegmentCeilingRangeRule(1.9, 4921.9),
      new OptOutSegmentCohortLengthRule(86400),
      new OptOutSegmentRequiredContactEmailRule("opt out segment needs this field"),
    ],
  );
}
