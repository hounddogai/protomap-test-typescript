import { BatchedReplyClaim } from "./batched-reply-claim.js";

/** A rule a batched reply claim must pass. Check returns its problems, or none. */
export interface BatchedReplyClaimRule {
  check(item: BatchedReplyClaim): string[];
}

export class BatchedReplyClaimCodeLengthRule implements BatchedReplyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedReplyClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedReplyClaimRequiredLabelRule implements BatchedReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReplyClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedReplyClaimArchivedGuardRule implements BatchedReplyClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedReplyClaim): string[] {
    if (item.archived && item.weight > this.limit) return [`weight ${item.weight} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class BatchedReplyClaimCodePrefixRule implements BatchedReplyClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedReplyClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedReplyClaimRequiredLocaleRule implements BatchedReplyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReplyClaim): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched reply claim. */
export class BatchedReplyClaimValidator {
  rules: BatchedReplyClaimRule[];

  constructor(rules: BatchedReplyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedReplyClaim): string[] {
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

  requireValid(item: BatchedReplyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedReplyClaim[]): Map<string, string[]> {
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

export function defaultBatchedReplyClaimValidator(): BatchedReplyClaimValidator {
  return new BatchedReplyClaimValidator(
    [
      new BatchedReplyClaimCodeLengthRule(255),
      new BatchedReplyClaimRequiredLabelRule("batched reply claim needs this field"),
      new BatchedReplyClaimArchivedGuardRule(0.4),
      new BatchedReplyClaimCodePrefixRule("ACM"),
      new BatchedReplyClaimRequiredLocaleRule("batched reply claim needs a value"),
    ],
  );
}
