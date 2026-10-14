import { BatchedOptOutBaseline } from "./batched-opt-out-baseline.js";

/** A rule a batched opt out baseline must pass. Check returns its problems, or none. */
export interface BatchedOptOutBaselineRule {
  check(item: BatchedOptOutBaseline): string[];
}

export class BatchedOptOutBaselineCampaignRefLengthRule implements BatchedOptOutBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedOptOutBaseline): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedOptOutBaselineRequiredChannelRule implements BatchedOptOutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedOptOutBaseline): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedOptOutBaselineCodePrefixRule implements BatchedOptOutBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedOptOutBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedOptOutBaselineRequiredCampaignRefRule implements BatchedOptOutBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedOptOutBaseline): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched opt out baseline. */
export class BatchedOptOutBaselineValidator {
  rules: BatchedOptOutBaselineRule[];

  constructor(rules: BatchedOptOutBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedOptOutBaseline): string[] {
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

  requireValid(item: BatchedOptOutBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedOptOutBaseline[]): Map<string, string[]> {
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

export function defaultBatchedOptOutBaselineValidator(): BatchedOptOutBaselineValidator {
  return new BatchedOptOutBaselineValidator(
    [
      new BatchedOptOutBaselineCampaignRefLengthRule(64),
      new BatchedOptOutBaselineRequiredChannelRule("batched opt out baseline needs this field"),
      new BatchedOptOutBaselineCodePrefixRule("REF"),
      new BatchedOptOutBaselineRequiredCampaignRefRule("batched opt out baseline needs a value"),
    ],
  );
}
