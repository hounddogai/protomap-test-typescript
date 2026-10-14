import { PendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

/** A rule a pending double opt in digest must pass. Check returns its problems, or none. */
export interface PendingDoubleOptInDigestRule {
  check(item: PendingDoubleOptInDigest): string[];
}

export class PendingDoubleOptInDigestLabelLengthRule implements PendingDoubleOptInDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDoubleOptInDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingDoubleOptInDigestRequiredTimezoneRule implements PendingDoubleOptInDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDoubleOptInDigest): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDoubleOptInDigestRequiredCodeRule implements PendingDoubleOptInDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingDoubleOptInDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingDoubleOptInDigestCodeLengthRule implements PendingDoubleOptInDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingDoubleOptInDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending double opt in digest. */
export class PendingDoubleOptInDigestValidator {
  rules: PendingDoubleOptInDigestRule[];

  constructor(rules: PendingDoubleOptInDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingDoubleOptInDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingDoubleOptInDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingDoubleOptInDigest[]): Map<string, string[]> {
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

export function defaultPendingDoubleOptInDigestValidator(): PendingDoubleOptInDigestValidator {
  return new PendingDoubleOptInDigestValidator(
    [
      new PendingDoubleOptInDigestLabelLengthRule(3600),
      new PendingDoubleOptInDigestRequiredTimezoneRule("pending double opt in digest needs an entry"),
      new PendingDoubleOptInDigestRequiredCodeRule("pending double opt in digest needs a value"),
      new PendingDoubleOptInDigestCodeLengthRule(86400),
    ],
  );
}
