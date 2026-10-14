import * as text from "../../../../kit/text.js";
import { LenientEnrollmentDigest } from "./lenient-enrollment-digest.js";

/** A rule a lenient enrollment digest must pass. Check returns its problems, or none. */
export interface LenientEnrollmentDigestRule {
  check(item: LenientEnrollmentDigest): string[];
}

export class LenientEnrollmentDigestCodeLengthRule implements LenientEnrollmentDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientEnrollmentDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientEnrollmentDigestThresholdRangeRule implements LenientEnrollmentDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientEnrollmentDigest): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientEnrollmentDigestRequiredLabelRule implements LenientEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientEnrollmentDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientEnrollmentDigestAllowedContactEmailRule implements LenientEnrollmentDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientEnrollmentDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is out of range`];
    return [];
  }
}

export class LenientEnrollmentDigestRequiredContactEmailRule implements LenientEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientEnrollmentDigest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient enrollment digest. */
export class LenientEnrollmentDigestValidator {
  rules: LenientEnrollmentDigestRule[];

  constructor(rules: LenientEnrollmentDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientEnrollmentDigest): string[] {
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

  requireValid(item: LenientEnrollmentDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientEnrollmentDigest[]): Map<string, string[]> {
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

export function defaultLenientEnrollmentDigestValidator(): LenientEnrollmentDigestValidator {
  return new LenientEnrollmentDigestValidator(
    [
      new LenientEnrollmentDigestCodeLengthRule(255),
      new LenientEnrollmentDigestThresholdRangeRule(7.4, 511.8),
      new LenientEnrollmentDigestRequiredLabelRule("lenient enrollment digest needs a value"),
      new LenientEnrollmentDigestAllowedContactEmailRule([]),
      new LenientEnrollmentDigestRequiredContactEmailRule("lenient enrollment digest needs an entry"),
    ],
  );
}
