import * as text from "../../../../kit/text.js";
import { ApprovalPolicy } from "./approval-policy.js";

/** A rule a approval policy must pass. Check returns its problems, or none. */
export interface ApprovalPolicyRule {
  check(item: ApprovalPolicy): string[];
}

export class ApprovalPolicyAllowedReviewerRule implements ApprovalPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is stale`];
    return [];
  }
}

export class ApprovalPolicyCodePrefixRule implements ApprovalPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ApprovalPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ApprovalPolicyRequiredCohortRule implements ApprovalPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalPolicy): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalPolicyExpiresAtRangeRule implements ApprovalPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalPolicy): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ApprovalPolicyNameLengthRule implements ApprovalPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalPolicyRequiredCodeRule implements ApprovalPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a approval policy. */
export class ApprovalPolicyValidator {
  rules: ApprovalPolicyRule[];

  constructor(rules: ApprovalPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalPolicy): string[] {
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

  requireValid(item: ApprovalPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalPolicy[]): Map<string, string[]> {
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

export function defaultApprovalPolicyValidator(): ApprovalPolicyValidator {
  return new ApprovalPolicyValidator(
    [
      new ApprovalPolicyAllowedReviewerRule(["manual", "legacy", "weighted"]),
      new ApprovalPolicyCodePrefixRule("X"),
      new ApprovalPolicyRequiredCohortRule("approval policy needs a value"),
      new ApprovalPolicyExpiresAtRangeRule(80, 86400),
      new ApprovalPolicyNameLengthRule(80),
      new ApprovalPolicyRequiredCodeRule("approval policy needs this field"),
    ],
  );
}
