import { ChallengeClaim } from "./challenge-claim.js";

/** A rule a challenge claim must pass. Check returns its problems, or none. */
export interface ChallengeClaimRule {
  check(item: ChallengeClaim): string[];
}

export class ChallengeClaimRequiredLabelRule implements ChallengeClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeClaimCountryLengthRule implements ChallengeClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeClaim): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeClaimLabelLengthRule implements ChallengeClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeClaimDiscountRangeRule implements ChallengeClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeClaim): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ChallengeClaimRequiredCountryRule implements ChallengeClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeClaim): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge claim. */
export class ChallengeClaimValidator {
  rules: ChallengeClaimRule[];

  constructor(rules: ChallengeClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeClaim[]): Map<string, string[]> {
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

export function defaultChallengeClaimValidator(): ChallengeClaimValidator {
  return new ChallengeClaimValidator(
    [
      new ChallengeClaimRequiredLabelRule("challenge claim needs a value"),
      new ChallengeClaimCountryLengthRule(64),
      new ChallengeClaimLabelLengthRule(64),
      new ChallengeClaimDiscountRangeRule(2, 3830.2),
      new ChallengeClaimRequiredCountryRule("challenge claim needs this field"),
    ],
  );
}
