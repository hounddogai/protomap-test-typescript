import * as text from "../../../../kit/text.js";
import { EnrollmentClaim } from "./enrollment-claim.js";

/** A rule a enrollment claim must pass. Check returns its problems, or none. */
export interface EnrollmentClaimRule {
  check(item: EnrollmentClaim): string[];
}

export class EnrollmentClaimRequiredCodeRule implements EnrollmentClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentClaimCodePrefixRule implements EnrollmentClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentClaimAllowedCohortRule implements EnrollmentClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is above maximum`];
    return [];
  }
}

export class EnrollmentClaimCohortLengthRule implements EnrollmentClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentClaim): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentClaimRequiredNameRule implements EnrollmentClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentClaimRequiredCohortRule implements EnrollmentClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentClaim): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a enrollment claim. */
export class EnrollmentClaimValidator {
  rules: EnrollmentClaimRule[];

  constructor(rules: EnrollmentClaimRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentClaim): string[] {
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

  requireValid(item: EnrollmentClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentClaim[]): Map<string, string[]> {
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

export function defaultEnrollmentClaimValidator(): EnrollmentClaimValidator {
  return new EnrollmentClaimValidator(
    [
      new EnrollmentClaimRequiredCodeRule("enrollment claim needs an entry"),
      new EnrollmentClaimCodePrefixRule("OPS"),
      new EnrollmentClaimAllowedCohortRule(["rolling"]),
      new EnrollmentClaimCohortLengthRule(86400),
      new EnrollmentClaimRequiredNameRule("enrollment claim needs an entry"),
      new EnrollmentClaimRequiredCohortRule("enrollment claim needs this field"),
    ],
  );
}
