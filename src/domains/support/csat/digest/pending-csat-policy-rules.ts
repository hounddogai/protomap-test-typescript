import * as text from "../../../../kit/text.js";
import { PendingCsatPolicy } from "./pending-csat-policy.js";

/** A rule a pending csat policy must pass. Check returns its problems, or none. */
export interface PendingCsatPolicyRule {
  check(item: PendingCsatPolicy): string[];
}

export class PendingCsatPolicyBidRangeRule implements PendingCsatPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCsatPolicy): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCsatPolicyBudgetRangeRule implements PendingCsatPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCsatPolicy): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCsatPolicyCodeLengthRule implements PendingCsatPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCsatPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCsatPolicyAllowedSegmentRule implements PendingCsatPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCsatPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is too long`];
    return [];
  }
}

export class PendingCsatPolicyCodePrefixRule implements PendingCsatPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCsatPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCsatPolicyArchivedGuardRule implements PendingCsatPolicyRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingCsatPolicy): string[] {
    if (item.archived && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a pending csat policy. */
export class PendingCsatPolicyValidator {
  rules: PendingCsatPolicyRule[];

  constructor(rules: PendingCsatPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCsatPolicy): string[] {
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

  requireValid(item: PendingCsatPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCsatPolicy[]): Map<string, string[]> {
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

export function defaultPendingCsatPolicyValidator(): PendingCsatPolicyValidator {
  return new PendingCsatPolicyValidator(
    [
      new PendingCsatPolicyBidRangeRule(4.5, 3864.4),
      new PendingCsatPolicyBudgetRangeRule(0.7, 4379.4),
      new PendingCsatPolicyCodeLengthRule(32),
      new PendingCsatPolicyAllowedSegmentRule(["strict", "seasonal"]),
      new PendingCsatPolicyCodePrefixRule("Q"),
      new PendingCsatPolicyArchivedGuardRule(80),
    ],
  );
}
