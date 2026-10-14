import * as text from "../../../../kit/text.js";
import { BatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

/** A rule a batched ticket view claim must pass. Check returns its problems, or none. */
export interface BatchedTicketViewClaimRule {
  check(item: BatchedTicketViewClaim): string[];
}

export class BatchedTicketViewClaimCapacityRangeRule implements BatchedTicketViewClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedTicketViewClaim): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedTicketViewClaimAllowedCodeRule implements BatchedTicketViewClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedTicketViewClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class BatchedTicketViewClaimTitleLengthRule implements BatchedTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTicketViewClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTicketViewClaimCodeLengthRule implements BatchedTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTicketViewClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedTicketViewClaimCategoryLengthRule implements BatchedTicketViewClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedTicketViewClaim): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched ticket view claim. */
export class BatchedTicketViewClaimValidator {
  rules: BatchedTicketViewClaimRule[];

  constructor(rules: BatchedTicketViewClaimRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedTicketViewClaim): string[] {
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

  requireValid(item: BatchedTicketViewClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedTicketViewClaim[]): Map<string, string[]> {
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

export function defaultBatchedTicketViewClaimValidator(): BatchedTicketViewClaimValidator {
  return new BatchedTicketViewClaimValidator(
    [
      new BatchedTicketViewClaimCapacityRangeRule(32, 86400),
      new BatchedTicketViewClaimAllowedCodeRule(["weighted", "seasonal", "seasonal"]),
      new BatchedTicketViewClaimTitleLengthRule(255),
      new BatchedTicketViewClaimCodeLengthRule(3600),
      new BatchedTicketViewClaimCategoryLengthRule(16),
    ],
  );
}
