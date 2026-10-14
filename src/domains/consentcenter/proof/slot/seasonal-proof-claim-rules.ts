import { SeasonalProofClaim } from "./seasonal-proof-claim.js";

/** A rule a seasonal proof claim must pass. Check returns its problems, or none. */
export interface SeasonalProofClaimRule {
  check(item: SeasonalProofClaim): string[];
}

export class SeasonalProofClaimRequiredOwnerIdRule implements SeasonalProofClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalProofClaim): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalProofClaimCodeLengthRule implements SeasonalProofClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalProofClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalProofClaimWeightRangeRule implements SeasonalProofClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalProofClaim): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal proof claim. */
export class SeasonalProofClaimValidator {
  rules: SeasonalProofClaimRule[];

  constructor(rules: SeasonalProofClaimRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalProofClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalProofClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalProofClaim[]): Map<string, string[]> {
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

export function defaultSeasonalProofClaimValidator(): SeasonalProofClaimValidator {
  return new SeasonalProofClaimValidator(
    [
      new SeasonalProofClaimRequiredOwnerIdRule("seasonal proof claim needs this field"),
      new SeasonalProofClaimCodeLengthRule(16),
      new SeasonalProofClaimWeightRangeRule(9.9, 3535.5),
    ],
  );
}
