import { LenientPostClaim } from "./lenient-post-claim.js";

/** A rule a lenient post claim must pass. Check returns its problems, or none. */
export interface LenientPostClaimRule {
  check(item: LenientPostClaim): string[];
}

export class LenientPostClaimUtmSourceLengthRule implements LenientPostClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostClaim): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostClaimCodeLengthRule implements LenientPostClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostClaimTitleLengthRule implements LenientPostClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient post claim. */
export class LenientPostClaimValidator {
  rules: LenientPostClaimRule[];

  constructor(rules: LenientPostClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPostClaim): string[] {
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

  requireValid(item: LenientPostClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPostClaim[]): Map<string, string[]> {
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

export function defaultLenientPostClaimValidator(): LenientPostClaimValidator {
  return new LenientPostClaimValidator(
    [
      new LenientPostClaimUtmSourceLengthRule(1000),
      new LenientPostClaimCodeLengthRule(80),
      new LenientPostClaimTitleLengthRule(32),
    ],
  );
}
