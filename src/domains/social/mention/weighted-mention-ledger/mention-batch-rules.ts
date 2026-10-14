import { MentionBatch } from "./mention-batch.js";

/** A rule a mention batch must pass. Check returns its problems, or none. */
export interface MentionBatchRule {
  check(item: MentionBatch): string[];
}

export class MentionBatchActiveGuardRule implements MentionBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MentionBatch): string[] {
    if (item.active && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while active`];
    return [];
  }
}

export class MentionBatchRequiredCodeRule implements MentionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MentionBatchRateRangeRule implements MentionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionBatch): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionBatchCodePrefixRule implements MentionBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a mention batch. */
export class MentionBatchValidator {
  rules: MentionBatchRule[];

  constructor(rules: MentionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: MentionBatch): string[] {
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

  requireValid(item: MentionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionBatch[]): Map<string, string[]> {
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

export function defaultMentionBatchValidator(): MentionBatchValidator {
  return new MentionBatchValidator(
    [
      new MentionBatchActiveGuardRule(1),
      new MentionBatchRequiredCodeRule("mention batch needs a value"),
      new MentionBatchRateRangeRule(7.7, 1391.9),
      new MentionBatchCodePrefixRule("Q"),
    ],
  );
}
