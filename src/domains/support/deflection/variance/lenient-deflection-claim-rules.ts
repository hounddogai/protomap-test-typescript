import * as text from "../../../../kit/text.js";
import { LenientDeflectionClaim } from "./lenient-deflection-claim.js";

/** A rule a lenient deflection claim must pass. Check returns its problems, or none. */
export interface LenientDeflectionClaimRule {
  check(item: LenientDeflectionClaim): string[];
}

export class LenientDeflectionClaimRequiredPhoneRule implements LenientDeflectionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionClaim): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionClaimAllowedPhoneRule implements LenientDeflectionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientDeflectionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is expired`];
    return [];
  }
}

export class LenientDeflectionClaimCodeLengthRule implements LenientDeflectionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientDeflectionClaimRequiredNotesRule implements LenientDeflectionClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientDeflectionClaim): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class LenientDeflectionClaimNotesLengthRule implements LenientDeflectionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientDeflectionClaim): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient deflection claim. */
export class LenientDeflectionClaimValidator {
  rules: LenientDeflectionClaimRule[];

  constructor(rules: LenientDeflectionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LenientDeflectionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientDeflectionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientDeflectionClaim[]): Map<string, string[]> {
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

export function defaultLenientDeflectionClaimValidator(): LenientDeflectionClaimValidator {
  return new LenientDeflectionClaimValidator(
    [
      new LenientDeflectionClaimRequiredPhoneRule("lenient deflection claim needs an entry"),
      new LenientDeflectionClaimAllowedPhoneRule(["pending", "lenient"]),
      new LenientDeflectionClaimCodeLengthRule(86400),
      new LenientDeflectionClaimRequiredNotesRule("lenient deflection claim needs a value"),
      new LenientDeflectionClaimNotesLengthRule(3600),
    ],
  );
}
