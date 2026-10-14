import * as text from "../../../../kit/text.js";
import { StreakClaim } from "./streak-claim.js";

/** A rule a streak claim must pass. Check returns its problems, or none. */
export interface StreakClaimRule {
  check(item: StreakClaim): string[];
}

export class StreakClaimAllowedExternalRefRule implements StreakClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is missing`];
    return [];
  }
}

export class StreakClaimCodePrefixRule implements StreakClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakClaimNameLengthRule implements StreakClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a streak claim. */
export class StreakClaimValidator {
  rules: StreakClaimRule[];

  constructor(rules: StreakClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StreakClaim): string[] {
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

  requireValid(item: StreakClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakClaim[]): Map<string, string[]> {
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

export function defaultStreakClaimValidator(): StreakClaimValidator {
  return new StreakClaimValidator(
    [
      new StreakClaimAllowedExternalRefRule(["seasonal"]),
      new StreakClaimCodePrefixRule("X"),
      new StreakClaimNameLengthRule(64),
    ],
  );
}
