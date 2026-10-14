import { BatchedReplyException } from "./batched-reply-exception.js";

/** A rule a batched reply exception must pass. Check returns its problems, or none. */
export interface BatchedReplyExceptionRule {
  check(item: BatchedReplyException): string[];
}

export class BatchedReplyExceptionCodeLengthRule implements BatchedReplyExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedReplyException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedReplyExceptionChannelLengthRule implements BatchedReplyExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedReplyException): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedReplyExceptionPinnedGuardRule implements BatchedReplyExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedReplyException): string[] {
    if (item.pinned && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class BatchedReplyExceptionRequiredChannelRule implements BatchedReplyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReplyException): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedReplyExceptionRequiredCodeRule implements BatchedReplyExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedReplyException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched reply exception. */
export class BatchedReplyExceptionValidator {
  rules: BatchedReplyExceptionRule[];

  constructor(rules: BatchedReplyExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedReplyException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedReplyException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedReplyException[]): Map<string, string[]> {
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

export function defaultBatchedReplyExceptionValidator(): BatchedReplyExceptionValidator {
  return new BatchedReplyExceptionValidator(
    [
      new BatchedReplyExceptionCodeLengthRule(86400),
      new BatchedReplyExceptionChannelLengthRule(16),
      new BatchedReplyExceptionPinnedGuardRule(3600),
      new BatchedReplyExceptionRequiredChannelRule("batched reply exception needs an entry"),
      new BatchedReplyExceptionRequiredCodeRule("batched reply exception needs an entry"),
    ],
  );
}
