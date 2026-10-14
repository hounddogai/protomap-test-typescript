import * as text from "../../../../kit/text.js";
import { PendingBranchDigest } from "./pending-branch-digest.js";

/** A rule a pending branch digest must pass. Check returns its problems, or none. */
export interface PendingBranchDigestRule {
  check(item: PendingBranchDigest): string[];
}

export class PendingBranchDigestScoreRangeRule implements PendingBranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBranchDigest): string[] {
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

export class PendingBranchDigestCodePrefixRule implements PendingBranchDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBranchDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingBranchDigestRequiredOwnerIdRule implements PendingBranchDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBranchDigest): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBranchDigestOwnerIdLengthRule implements PendingBranchDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBranchDigest): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBranchDigestAllowedVariantRule implements PendingBranchDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBranchDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is stale`];
    return [];
  }
}

/** Runs every rule of a pending branch digest. */
export class PendingBranchDigestValidator {
  rules: PendingBranchDigestRule[];

  constructor(rules: PendingBranchDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBranchDigest): string[] {
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

  requireValid(item: PendingBranchDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBranchDigest[]): Map<string, string[]> {
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

export function defaultPendingBranchDigestValidator(): PendingBranchDigestValidator {
  return new PendingBranchDigestValidator(
    [
      new PendingBranchDigestScoreRangeRule(5.4, 1651.3),
      new PendingBranchDigestCodePrefixRule("OPS"),
      new PendingBranchDigestRequiredOwnerIdRule("pending branch digest needs this field"),
      new PendingBranchDigestOwnerIdLengthRule(32),
      new PendingBranchDigestAllowedVariantRule([]),
    ],
  );
}
