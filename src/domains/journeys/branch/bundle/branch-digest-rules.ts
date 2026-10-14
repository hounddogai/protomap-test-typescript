import { BranchDigest } from "./branch-digest.js";

/** A rule a branch digest must pass. Check returns its problems, or none. */
export interface BranchDigestRule {
  check(item: BranchDigest): string[];
}

export class BranchDigestRequiredLabelRule implements BranchDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BranchDigestCodePrefixRule implements BranchDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchDigestCeilingRangeRule implements BranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchDigest): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchDigestRequiredUnitRule implements BranchDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchDigest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class BranchDigestChannelLengthRule implements BranchDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchDigest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchDigestBatchSizeRangeRule implements BranchDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchDigest): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a branch digest. */
export class BranchDigestValidator {
  rules: BranchDigestRule[];

  constructor(rules: BranchDigestRule[]) {
    this.rules = rules;
  }

  validate(item: BranchDigest): string[] {
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

  requireValid(item: BranchDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchDigest[]): Map<string, string[]> {
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

export function defaultBranchDigestValidator(): BranchDigestValidator {
  return new BranchDigestValidator(
    [
      new BranchDigestRequiredLabelRule("branch digest needs this field"),
      new BranchDigestCodePrefixRule("OPS"),
      new BranchDigestCeilingRangeRule(1.7, 4156.7),
      new BranchDigestRequiredUnitRule("branch digest needs an entry"),
      new BranchDigestChannelLengthRule(16),
      new BranchDigestBatchSizeRangeRule(64, 3600),
    ],
  );
}
