import { CappedFraudCheckClaim } from "./capped-fraud-check-claim.js";

/** A rule a capped fraud check claim must pass. Check returns its problems, or none. */
export interface CappedFraudCheckClaimRule {
  check(item: CappedFraudCheckClaim): string[];
}

export class CappedFraudCheckClaimRequiredTitleRule implements CappedFraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFraudCheckClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFraudCheckClaimTagsLimitRule implements CappedFraudCheckClaimRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: CappedFraudCheckClaim): string[] {
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

export class CappedFraudCheckClaimPinnedGuardRule implements CappedFraudCheckClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedFraudCheckClaim): string[] {
    if (item.pinned && item.priority > this.limit) return [`priority ${item.priority} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class CappedFraudCheckClaimCodeLengthRule implements CappedFraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFraudCheckClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped fraud check claim. */
export class CappedFraudCheckClaimValidator {
  rules: CappedFraudCheckClaimRule[];

  constructor(rules: CappedFraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFraudCheckClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFraudCheckClaim[]): Map<string, string[]> {
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

export function defaultCappedFraudCheckClaimValidator(): CappedFraudCheckClaimValidator {
  return new CappedFraudCheckClaimValidator(
    [
      new CappedFraudCheckClaimRequiredTitleRule("capped fraud check claim needs a value"),
      new CappedFraudCheckClaimTagsLimitRule(1000, ["legacy", "default"]),
      new CappedFraudCheckClaimPinnedGuardRule(86400),
      new CappedFraudCheckClaimCodeLengthRule(255),
    ],
  );
}
