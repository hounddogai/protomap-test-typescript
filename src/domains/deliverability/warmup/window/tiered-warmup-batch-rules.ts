import { TieredWarmupBatch } from "./tiered-warmup-batch.js";

/** A rule a tiered warmup batch must pass. Check returns its problems, or none. */
export interface TieredWarmupBatchRule {
  check(item: TieredWarmupBatch): string[];
}

export class TieredWarmupBatchAudienceIdLengthRule implements TieredWarmupBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredWarmupBatch): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredWarmupBatchRequiredCodeRule implements TieredWarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWarmupBatchRequiredAudienceIdRule implements TieredWarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupBatch): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWarmupBatchRequiredTitleRule implements TieredWarmupBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWarmupBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWarmupBatchCodePrefixRule implements TieredWarmupBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredWarmupBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered warmup batch. */
export class TieredWarmupBatchValidator {
  rules: TieredWarmupBatchRule[];

  constructor(rules: TieredWarmupBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWarmupBatch): string[] {
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

  requireValid(item: TieredWarmupBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWarmupBatch[]): Map<string, string[]> {
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

export function defaultTieredWarmupBatchValidator(): TieredWarmupBatchValidator {
  return new TieredWarmupBatchValidator(
    [
      new TieredWarmupBatchAudienceIdLengthRule(16),
      new TieredWarmupBatchRequiredCodeRule("tiered warmup batch needs an entry"),
      new TieredWarmupBatchRequiredAudienceIdRule("tiered warmup batch needs this field"),
      new TieredWarmupBatchRequiredTitleRule("tiered warmup batch needs this field"),
      new TieredWarmupBatchCodePrefixRule("Q"),
    ],
  );
}
