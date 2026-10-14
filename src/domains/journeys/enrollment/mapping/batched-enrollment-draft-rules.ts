import * as text from "../../../../kit/text.js";
import { BatchedEnrollmentDraft } from "./batched-enrollment-draft.js";

/** A rule a batched enrollment draft must pass. Check returns its problems, or none. */
export interface BatchedEnrollmentDraftRule {
  check(item: BatchedEnrollmentDraft): string[];
}

export class BatchedEnrollmentDraftAllowedLocaleRule implements BatchedEnrollmentDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedEnrollmentDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is below minimum`];
    return [];
  }
}

export class BatchedEnrollmentDraftRequiredNameRule implements BatchedEnrollmentDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedEnrollmentDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedEnrollmentDraftVariantLengthRule implements BatchedEnrollmentDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedEnrollmentDraft): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedEnrollmentDraftCodePrefixRule implements BatchedEnrollmentDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedEnrollmentDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedEnrollmentDraftRequiredCodeRule implements BatchedEnrollmentDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedEnrollmentDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedEnrollmentDraftPinnedGuardRule implements BatchedEnrollmentDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedEnrollmentDraft): string[] {
    if (item.pinned && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a batched enrollment draft. */
export class BatchedEnrollmentDraftValidator {
  rules: BatchedEnrollmentDraftRule[];

  constructor(rules: BatchedEnrollmentDraftRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedEnrollmentDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedEnrollmentDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedEnrollmentDraft[]): Map<string, string[]> {
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

export function defaultBatchedEnrollmentDraftValidator(): BatchedEnrollmentDraftValidator {
  return new BatchedEnrollmentDraftValidator(
    [
      new BatchedEnrollmentDraftAllowedLocaleRule([]),
      new BatchedEnrollmentDraftRequiredNameRule("batched enrollment draft needs an entry"),
      new BatchedEnrollmentDraftVariantLengthRule(86400),
      new BatchedEnrollmentDraftCodePrefixRule("ACM"),
      new BatchedEnrollmentDraftRequiredCodeRule("batched enrollment draft needs this field"),
      new BatchedEnrollmentDraftPinnedGuardRule(16),
    ],
  );
}
