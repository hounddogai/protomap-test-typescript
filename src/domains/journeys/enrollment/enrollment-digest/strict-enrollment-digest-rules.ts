import * as text from "../../../../kit/text.js";
import { StrictEnrollmentDigest } from "./strict-enrollment-digest.js";

/** A rule a strict enrollment digest must pass. Check returns its problems, or none. */
export interface StrictEnrollmentDigestRule {
  check(item: StrictEnrollmentDigest): string[];
}

export class StrictEnrollmentDigestUtmSourceLengthRule implements StrictEnrollmentDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictEnrollmentDigest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictEnrollmentDigestCodePrefixRule implements StrictEnrollmentDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictEnrollmentDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictEnrollmentDigestAllowedUnitRule implements StrictEnrollmentDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictEnrollmentDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is blocked`];
    return [];
  }
}

export class StrictEnrollmentDigestRequiredCodeRule implements StrictEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictEnrollmentDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict enrollment digest. */
export class StrictEnrollmentDigestValidator {
  rules: StrictEnrollmentDigestRule[];

  constructor(rules: StrictEnrollmentDigestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictEnrollmentDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictEnrollmentDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictEnrollmentDigest[]): Map<string, string[]> {
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

export function defaultStrictEnrollmentDigestValidator(): StrictEnrollmentDigestValidator {
  return new StrictEnrollmentDigestValidator(
    [
      new StrictEnrollmentDigestUtmSourceLengthRule(120),
      new StrictEnrollmentDigestCodePrefixRule("X"),
      new StrictEnrollmentDigestAllowedUnitRule(["regional", "legacy", "fallback"]),
      new StrictEnrollmentDigestRequiredCodeRule("strict enrollment digest needs this field"),
    ],
  );
}
