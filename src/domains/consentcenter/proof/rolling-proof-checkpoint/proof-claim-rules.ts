import { ProofClaim } from "./proof-claim.js";

/** A rule a proof claim must pass. Check returns its problems, or none. */
export interface ProofClaimRule {
  check(item: ProofClaim): string[];
}

export class ProofClaimAmountRangeRule implements ProofClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofClaim): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofClaimTagsLimitRule implements ProofClaimRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ProofClaim): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ProofClaimCohortLengthRule implements ProofClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofClaim): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofClaimRequiredLabelRule implements ProofClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ProofClaimPriorityRangeRule implements ProofClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofClaim): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a proof claim. */
export class ProofClaimValidator {
  rules: ProofClaimRule[];

  constructor(rules: ProofClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ProofClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofClaim[]): Map<string, string[]> {
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

export function defaultProofClaimValidator(): ProofClaimValidator {
  return new ProofClaimValidator(
    [
      new ProofClaimAmountRangeRule(4.6, 756.8),
      new ProofClaimTagsLimitRule(32, ["strict", "capped"]),
      new ProofClaimCohortLengthRule(120),
      new ProofClaimRequiredLabelRule("proof claim needs this field"),
      new ProofClaimPriorityRangeRule(32, 86400),
    ],
  );
}
