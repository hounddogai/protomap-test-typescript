import { BidRuleCheckpoint } from "./bid-rule-checkpoint.js";

/** A rule a bid rule checkpoint must pass. Check returns its problems, or none. */
export interface BidRuleCheckpointRule {
  check(item: BidRuleCheckpoint): string[];
}

export class BidRuleCheckpointRequiredCodeRule implements BidRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleCheckpointRequiredChecksumRule implements BidRuleCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleCheckpoint): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleCheckpointReviewerLengthRule implements BidRuleCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleCheckpoint): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleCheckpointCodePrefixRule implements BidRuleCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bid rule checkpoint. */
export class BidRuleCheckpointValidator {
  rules: BidRuleCheckpointRule[];

  constructor(rules: BidRuleCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleCheckpoint): string[] {
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

  requireValid(item: BidRuleCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleCheckpoint[]): Map<string, string[]> {
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

export function defaultBidRuleCheckpointValidator(): BidRuleCheckpointValidator {
  return new BidRuleCheckpointValidator(
    [
      new BidRuleCheckpointRequiredCodeRule("bid rule checkpoint needs a value"),
      new BidRuleCheckpointRequiredChecksumRule("bid rule checkpoint needs this field"),
      new BidRuleCheckpointReviewerLengthRule(16),
      new BidRuleCheckpointCodePrefixRule("ACM"),
    ],
  );
}
