import { BatchedOptOutScore } from "./batched-opt-out-score.js";

/** A rule a batched opt out score must pass. Check returns its problems, or none. */
export interface BatchedOptOutScoreRule {
  check(item: BatchedOptOutScore): string[];
}

export class BatchedOptOutScoreRequiredChannelRule implements BatchedOptOutScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedOptOutScore): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedOptOutScoreCodePrefixRule implements BatchedOptOutScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedOptOutScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedOptOutScoreCodeLengthRule implements BatchedOptOutScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedOptOutScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched opt out score. */
export class BatchedOptOutScoreValidator {
  rules: BatchedOptOutScoreRule[];

  constructor(rules: BatchedOptOutScoreRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedOptOutScore): string[] {
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

  requireValid(item: BatchedOptOutScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedOptOutScore[]): Map<string, string[]> {
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

export function defaultBatchedOptOutScoreValidator(): BatchedOptOutScoreValidator {
  return new BatchedOptOutScoreValidator(
    [
      new BatchedOptOutScoreRequiredChannelRule("batched opt out score needs a value"),
      new BatchedOptOutScoreCodePrefixRule("ACM"),
      new BatchedOptOutScoreCodeLengthRule(86400),
    ],
  );
}
