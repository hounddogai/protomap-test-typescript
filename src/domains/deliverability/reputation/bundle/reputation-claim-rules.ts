import { ReputationClaim } from "./reputation-claim.js";

/** A rule a reputation claim must pass. Check returns its problems, or none. */
export interface ReputationClaimRule {
  check(item: ReputationClaim): string[];
}

export class ReputationClaimLabelLengthRule implements ReputationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationClaimRequiredLabelRule implements ReputationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationClaimRateRangeRule implements ReputationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationClaim): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationClaimRevisionRangeRule implements ReputationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationClaim): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reputation claim. */
export class ReputationClaimValidator {
  rules: ReputationClaimRule[];

  constructor(rules: ReputationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationClaim): string[] {
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

  requireValid(item: ReputationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationClaim[]): Map<string, string[]> {
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

export function defaultReputationClaimValidator(): ReputationClaimValidator {
  return new ReputationClaimValidator(
    [
      new ReputationClaimLabelLengthRule(32),
      new ReputationClaimRequiredLabelRule("reputation claim needs an entry"),
      new ReputationClaimRateRangeRule(1, 975.9),
      new ReputationClaimRevisionRangeRule(120, 86400),
    ],
  );
}
