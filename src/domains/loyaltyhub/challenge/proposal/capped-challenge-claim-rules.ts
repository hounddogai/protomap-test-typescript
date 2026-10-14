import { CappedChallengeClaim } from "./capped-challenge-claim.js";

/** A rule a capped challenge claim must pass. Check returns its problems, or none. */
export interface CappedChallengeClaimRule {
  check(item: CappedChallengeClaim): string[];
}

export class CappedChallengeClaimChecksumLengthRule implements CappedChallengeClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedChallengeClaim): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedChallengeClaimCountryLengthRule implements CappedChallengeClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedChallengeClaim): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedChallengeClaimScoreRangeRule implements CappedChallengeClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedChallengeClaim): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedChallengeClaimRequiredCodeRule implements CappedChallengeClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedChallengeClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedChallengeClaimNameLengthRule implements CappedChallengeClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedChallengeClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedChallengeClaimRequiredChecksumRule implements CappedChallengeClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedChallengeClaim): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped challenge claim. */
export class CappedChallengeClaimValidator {
  rules: CappedChallengeClaimRule[];

  constructor(rules: CappedChallengeClaimRule[]) {
    this.rules = rules;
  }

  validate(item: CappedChallengeClaim): string[] {
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

  requireValid(item: CappedChallengeClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedChallengeClaim[]): Map<string, string[]> {
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

export function defaultCappedChallengeClaimValidator(): CappedChallengeClaimValidator {
  return new CappedChallengeClaimValidator(
    [
      new CappedChallengeClaimChecksumLengthRule(32),
      new CappedChallengeClaimCountryLengthRule(3600),
      new CappedChallengeClaimScoreRangeRule(7, 3724.3),
      new CappedChallengeClaimRequiredCodeRule("capped challenge claim needs a value"),
      new CappedChallengeClaimNameLengthRule(32),
      new CappedChallengeClaimRequiredChecksumRule("capped challenge claim needs a value"),
    ],
  );
}
