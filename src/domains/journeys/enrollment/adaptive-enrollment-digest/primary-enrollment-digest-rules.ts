import * as text from "../../../../kit/text.js";
import { PrimaryEnrollmentDigest } from "./primary-enrollment-digest.js";

/** A rule a primary enrollment digest must pass. Check returns its problems, or none. */
export interface PrimaryEnrollmentDigestRule {
  check(item: PrimaryEnrollmentDigest): string[];
}

export class PrimaryEnrollmentDigestAllowedChecksumRule implements PrimaryEnrollmentDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryEnrollmentDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is too long`];
    return [];
  }
}

export class PrimaryEnrollmentDigestRequiredChecksumRule implements PrimaryEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEnrollmentDigest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryEnrollmentDigestRequiredChannelRule implements PrimaryEnrollmentDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryEnrollmentDigest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary enrollment digest. */
export class PrimaryEnrollmentDigestValidator {
  rules: PrimaryEnrollmentDigestRule[];

  constructor(rules: PrimaryEnrollmentDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryEnrollmentDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryEnrollmentDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryEnrollmentDigest[]): Map<string, string[]> {
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

export function defaultPrimaryEnrollmentDigestValidator(): PrimaryEnrollmentDigestValidator {
  return new PrimaryEnrollmentDigestValidator(
    [
      new PrimaryEnrollmentDigestAllowedChecksumRule(["weighted"]),
      new PrimaryEnrollmentDigestRequiredChecksumRule("primary enrollment digest needs an entry"),
      new PrimaryEnrollmentDigestRequiredChannelRule("primary enrollment digest needs this field"),
    ],
  );
}
