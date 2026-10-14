import * as text from "../../../../kit/text.js";
import { BatchedBranchNotice } from "./batched-branch-notice.js";

/** A rule a batched branch notice must pass. Check returns its problems, or none. */
export interface BatchedBranchNoticeRule {
  check(item: BatchedBranchNotice): string[];
}

export class BatchedBranchNoticeCodeLengthRule implements BatchedBranchNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBranchNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedBranchNoticeAllowedPhoneRule implements BatchedBranchNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedBranchNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is below minimum`];
    return [];
  }
}

export class BatchedBranchNoticeCodePrefixRule implements BatchedBranchNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedBranchNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedBranchNoticeApprovedGuardRule implements BatchedBranchNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedBranchNotice): string[] {
    if (item.approved && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a batched branch notice. */
export class BatchedBranchNoticeValidator {
  rules: BatchedBranchNoticeRule[];

  constructor(rules: BatchedBranchNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBranchNotice): string[] {
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

  requireValid(item: BatchedBranchNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBranchNotice[]): Map<string, string[]> {
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

export function defaultBatchedBranchNoticeValidator(): BatchedBranchNoticeValidator {
  return new BatchedBranchNoticeValidator(
    [
      new BatchedBranchNoticeCodeLengthRule(86400),
      new BatchedBranchNoticeAllowedPhoneRule([]),
      new BatchedBranchNoticeCodePrefixRule("Q"),
      new BatchedBranchNoticeApprovedGuardRule(80),
    ],
  );
}
