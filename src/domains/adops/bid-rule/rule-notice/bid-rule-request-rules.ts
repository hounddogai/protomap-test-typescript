import * as text from "../../../../kit/text.js";
import { BidRuleRequest } from "./bid-rule-request.js";

/** A rule a bid rule request must pass. Check returns its problems, or none. */
export interface BidRuleRequestRule {
  check(item: BidRuleRequest): string[];
}

export class BidRuleRequestApprovedGuardRule implements BidRuleRequestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BidRuleRequest): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BidRuleRequestAllowedCodeRule implements BidRuleRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class BidRuleRequestCodeLengthRule implements BidRuleRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bid rule request. */
export class BidRuleRequestValidator {
  rules: BidRuleRequestRule[];

  constructor(rules: BidRuleRequestRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BidRuleRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleRequest[]): Map<string, string[]> {
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

export function defaultBidRuleRequestValidator(): BidRuleRequestValidator {
  return new BidRuleRequestValidator(
    [
      new BidRuleRequestApprovedGuardRule(3.4),
      new BidRuleRequestAllowedCodeRule(["scheduled", "primary"]),
      new BidRuleRequestCodeLengthRule(16),
    ],
  );
}
