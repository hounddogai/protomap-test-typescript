import * as text from "../../../../kit/text.js";
import { FraudCheckClaim } from "./fraud-check-claim.js";

/** A rule a fraud check claim must pass. Check returns its problems, or none. */
export interface FraudCheckClaimRule {
  check(item: FraudCheckClaim): string[];
}

export class FraudCheckClaimAllowedNameRule implements FraudCheckClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is unknown`];
    return [];
  }
}

export class FraudCheckClaimTagsLimitRule implements FraudCheckClaimRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FraudCheckClaim): string[] {
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

export class FraudCheckClaimRequiredNameRule implements FraudCheckClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckClaimChecksumLengthRule implements FraudCheckClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckClaim): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckClaimClicksRangeRule implements FraudCheckClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckClaim): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fraud check claim. */
export class FraudCheckClaimValidator {
  rules: FraudCheckClaimRule[];

  constructor(rules: FraudCheckClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckClaim[]): Map<string, string[]> {
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

export function defaultFraudCheckClaimValidator(): FraudCheckClaimValidator {
  return new FraudCheckClaimValidator(
    [
      new FraudCheckClaimAllowedNameRule(["legacy"]),
      new FraudCheckClaimTagsLimitRule(16, ["batched"]),
      new FraudCheckClaimRequiredNameRule("fraud check claim needs this field"),
      new FraudCheckClaimChecksumLengthRule(32),
      new FraudCheckClaimClicksRangeRule(80, 120),
    ],
  );
}
