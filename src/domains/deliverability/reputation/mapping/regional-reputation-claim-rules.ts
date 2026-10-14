import * as text from "../../../../kit/text.js";
import { RegionalReputationClaim } from "./regional-reputation-claim.js";

/** A rule a regional reputation claim must pass. Check returns its problems, or none. */
export interface RegionalReputationClaimRule {
  check(item: RegionalReputationClaim): string[];
}

export class RegionalReputationClaimRequiredNameRule implements RegionalReputationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReputationClaimCodePrefixRule implements RegionalReputationClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalReputationClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalReputationClaimRequiredTitleRule implements RegionalReputationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReputationClaimRequiredCodeRule implements RegionalReputationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReputationClaimNameLengthRule implements RegionalReputationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationClaimAllowedTitleRule implements RegionalReputationClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalReputationClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

/** Runs every rule of a regional reputation claim. */
export class RegionalReputationClaimValidator {
  rules: RegionalReputationClaimRule[];

  constructor(rules: RegionalReputationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReputationClaim): string[] {
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

  requireValid(item: RegionalReputationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReputationClaim[]): Map<string, string[]> {
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

export function defaultRegionalReputationClaimValidator(): RegionalReputationClaimValidator {
  return new RegionalReputationClaimValidator(
    [
      new RegionalReputationClaimRequiredNameRule("regional reputation claim needs this field"),
      new RegionalReputationClaimCodePrefixRule("Q"),
      new RegionalReputationClaimRequiredTitleRule("regional reputation claim needs this field"),
      new RegionalReputationClaimRequiredCodeRule("regional reputation claim needs a value"),
      new RegionalReputationClaimNameLengthRule(86400),
      new RegionalReputationClaimAllowedTitleRule(["lenient"]),
    ],
  );
}
