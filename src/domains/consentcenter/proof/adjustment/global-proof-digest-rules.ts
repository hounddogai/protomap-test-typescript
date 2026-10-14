import { GlobalProofDigest } from "./global-proof-digest.js";

/** A rule a global proof digest must pass. Check returns its problems, or none. */
export interface GlobalProofDigestRule {
  check(item: GlobalProofDigest): string[];
}

export class GlobalProofDigestChecksumLengthRule implements GlobalProofDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalProofDigest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalProofDigestRequiredChecksumRule implements GlobalProofDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalProofDigest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalProofDigestEndsAtRangeRule implements GlobalProofDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalProofDigest): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalProofDigestRequiredCodeRule implements GlobalProofDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalProofDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global proof digest. */
export class GlobalProofDigestValidator {
  rules: GlobalProofDigestRule[];

  constructor(rules: GlobalProofDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalProofDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalProofDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalProofDigest[]): Map<string, string[]> {
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

export function defaultGlobalProofDigestValidator(): GlobalProofDigestValidator {
  return new GlobalProofDigestValidator(
    [
      new GlobalProofDigestChecksumLengthRule(64),
      new GlobalProofDigestRequiredChecksumRule("global proof digest needs a value"),
      new GlobalProofDigestEndsAtRangeRule(255, 86400),
      new GlobalProofDigestRequiredCodeRule("global proof digest needs an entry"),
    ],
  );
}
