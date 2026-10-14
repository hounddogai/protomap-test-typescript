import { ManualProofTier } from "./manual-proof-tier.js";

/** A rule a manual proof tier must pass. Check returns its problems, or none. */
export interface ManualProofTierRule {
  check(item: ManualProofTier): string[];
}

export class ManualProofTierBatchSizeRangeRule implements ManualProofTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualProofTier): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualProofTierCodeLengthRule implements ManualProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualProofTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualProofTierRequiredChannelRule implements ManualProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualProofTier): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual proof tier. */
export class ManualProofTierValidator {
  rules: ManualProofTierRule[];

  constructor(rules: ManualProofTierRule[]) {
    this.rules = rules;
  }

  validate(item: ManualProofTier): string[] {
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

  requireValid(item: ManualProofTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualProofTier[]): Map<string, string[]> {
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

export function defaultManualProofTierValidator(): ManualProofTierValidator {
  return new ManualProofTierValidator(
    [
      new ManualProofTierBatchSizeRangeRule(64, 86400),
      new ManualProofTierCodeLengthRule(80),
      new ManualProofTierRequiredChannelRule("manual proof tier needs an entry"),
    ],
  );
}
