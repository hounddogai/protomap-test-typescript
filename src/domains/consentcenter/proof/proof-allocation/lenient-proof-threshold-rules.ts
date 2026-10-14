import { LenientProofThreshold } from "./lenient-proof-threshold.js";

/** A rule a lenient proof threshold must pass. Check returns its problems, or none. */
export interface LenientProofThresholdRule {
  check(item: LenientProofThreshold): string[];
}

export class LenientProofThresholdExpiresAtRangeRule implements LenientProofThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientProofThreshold): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientProofThresholdRequiredTitleRule implements LenientProofThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientProofThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientProofThresholdBatchSizeRangeRule implements LenientProofThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientProofThreshold): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientProofThresholdRequiredCodeRule implements LenientProofThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientProofThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient proof threshold. */
export class LenientProofThresholdValidator {
  rules: LenientProofThresholdRule[];

  constructor(rules: LenientProofThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LenientProofThreshold): string[] {
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

  requireValid(item: LenientProofThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientProofThreshold[]): Map<string, string[]> {
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

export function defaultLenientProofThresholdValidator(): LenientProofThresholdValidator {
  return new LenientProofThresholdValidator(
    [
      new LenientProofThresholdExpiresAtRangeRule(1000, 86400),
      new LenientProofThresholdRequiredTitleRule("lenient proof threshold needs an entry"),
      new LenientProofThresholdBatchSizeRangeRule(64, 80),
      new LenientProofThresholdRequiredCodeRule("lenient proof threshold needs this field"),
    ],
  );
}
