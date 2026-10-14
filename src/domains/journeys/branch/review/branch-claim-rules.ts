import { BranchClaim } from "./branch-claim.js";

/** A rule a branch claim must pass. Check returns its problems, or none. */
export interface BranchClaimRule {
  check(item: BranchClaim): string[];
}

export class BranchClaimPriorityRangeRule implements BranchClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchClaim): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchClaimJourneyIdLengthRule implements BranchClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchClaim): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchClaimRequiredCodeRule implements BranchClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchClaimRequiredNameRule implements BranchClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch claim. */
export class BranchClaimValidator {
  rules: BranchClaimRule[];

  constructor(rules: BranchClaimRule[]) {
    this.rules = rules;
  }

  validate(item: BranchClaim): string[] {
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

  requireValid(item: BranchClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchClaim[]): Map<string, string[]> {
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

export function defaultBranchClaimValidator(): BranchClaimValidator {
  return new BranchClaimValidator(
    [
      new BranchClaimPriorityRangeRule(16, 120),
      new BranchClaimJourneyIdLengthRule(64),
      new BranchClaimRequiredCodeRule("branch claim needs an entry"),
      new BranchClaimRequiredNameRule("branch claim needs a value"),
    ],
  );
}
