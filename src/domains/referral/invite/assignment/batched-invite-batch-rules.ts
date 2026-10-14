import { BatchedInviteBatch } from "./batched-invite-batch.js";

/** A rule a batched invite batch must pass. Check returns its problems, or none. */
export interface BatchedInviteBatchRule {
  check(item: BatchedInviteBatch): string[];
}

export class BatchedInviteBatchRequiredNameRule implements BatchedInviteBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInviteBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInviteBatchNameLengthRule implements BatchedInviteBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInviteBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInviteBatchRequiredCodeRule implements BatchedInviteBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedInviteBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedInviteBatchCodePrefixRule implements BatchedInviteBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedInviteBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched invite batch. */
export class BatchedInviteBatchValidator {
  rules: BatchedInviteBatchRule[];

  constructor(rules: BatchedInviteBatchRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInviteBatch): string[] {
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

  requireValid(item: BatchedInviteBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInviteBatch[]): Map<string, string[]> {
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

export function defaultBatchedInviteBatchValidator(): BatchedInviteBatchValidator {
  return new BatchedInviteBatchValidator(
    [
      new BatchedInviteBatchRequiredNameRule("batched invite batch needs an entry"),
      new BatchedInviteBatchNameLengthRule(64),
      new BatchedInviteBatchRequiredCodeRule("batched invite batch needs an entry"),
      new BatchedInviteBatchCodePrefixRule("OPS"),
    ],
  );
}
