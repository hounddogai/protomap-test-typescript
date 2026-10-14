import { RewardBatch } from "./reward-batch.js";

/** A rule a reward batch must pass. Check returns its problems, or none. */
export interface RewardBatchRule {
  check(item: RewardBatch): string[];
}

export class RewardBatchRequiredNameRule implements RewardBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBatchVariantLengthRule implements RewardBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardBatch): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardBatchCodePrefixRule implements RewardBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardBatchRequiredCodeRule implements RewardBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBatchNotesLengthRule implements RewardBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardBatch): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward batch. */
export class RewardBatchValidator {
  rules: RewardBatchRule[];

  constructor(rules: RewardBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RewardBatch): string[] {
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

  requireValid(item: RewardBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardBatch[]): Map<string, string[]> {
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

export function defaultRewardBatchValidator(): RewardBatchValidator {
  return new RewardBatchValidator(
    [
      new RewardBatchRequiredNameRule("reward batch needs a value"),
      new RewardBatchVariantLengthRule(80),
      new RewardBatchCodePrefixRule("ACM"),
      new RewardBatchRequiredCodeRule("reward batch needs an entry"),
      new RewardBatchNotesLengthRule(255),
    ],
  );
}
