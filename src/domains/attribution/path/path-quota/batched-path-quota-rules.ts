import * as text from "../../../../kit/text.js";
import { BatchedPathQuota } from "./batched-path-quota.js";

/** A rule a batched path quota must pass. Check returns its problems, or none. */
export interface BatchedPathQuotaRule {
  check(item: BatchedPathQuota): string[];
}

export class BatchedPathQuotaRequiredNameRule implements BatchedPathQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPathQuota): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPathQuotaTitleLengthRule implements BatchedPathQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPathQuotaAllowedNameRule implements BatchedPathQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPathQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class BatchedPathQuotaTagsLimitRule implements BatchedPathQuotaRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedPathQuota): string[] {
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

export class BatchedPathQuotaCodePrefixRule implements BatchedPathQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPathQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPathQuotaNameLengthRule implements BatchedPathQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPathQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched path quota. */
export class BatchedPathQuotaValidator {
  rules: BatchedPathQuotaRule[];

  constructor(rules: BatchedPathQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPathQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPathQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPathQuota[]): Map<string, string[]> {
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

export function defaultBatchedPathQuotaValidator(): BatchedPathQuotaValidator {
  return new BatchedPathQuotaValidator(
    [
      new BatchedPathQuotaRequiredNameRule("batched path quota needs an entry"),
      new BatchedPathQuotaTitleLengthRule(32),
      new BatchedPathQuotaAllowedNameRule(["scheduled", "pending", "adaptive"]),
      new BatchedPathQuotaTagsLimitRule(120, ["seasonal"]),
      new BatchedPathQuotaCodePrefixRule("REF"),
      new BatchedPathQuotaNameLengthRule(80),
    ],
  );
}
