import { ScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

/** A rule a scheduled frequency claim must pass. Check returns its problems, or none. */
export interface ScheduledFrequencyClaimRule {
  check(item: ScheduledFrequencyClaim): string[];
}

export class ScheduledFrequencyClaimLabelLengthRule implements ScheduledFrequencyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFrequencyClaimBatchSizeRangeRule implements ScheduledFrequencyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFrequencyClaim): string[] {
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

export class ScheduledFrequencyClaimCeilingRangeRule implements ScheduledFrequencyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFrequencyClaim): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledFrequencyClaimCodeLengthRule implements ScheduledFrequencyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFrequencyClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled frequency claim. */
export class ScheduledFrequencyClaimValidator {
  rules: ScheduledFrequencyClaimRule[];

  constructor(rules: ScheduledFrequencyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFrequencyClaim): string[] {
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

  requireValid(item: ScheduledFrequencyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFrequencyClaim[]): Map<string, string[]> {
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

export function defaultScheduledFrequencyClaimValidator(): ScheduledFrequencyClaimValidator {
  return new ScheduledFrequencyClaimValidator(
    [
      new ScheduledFrequencyClaimLabelLengthRule(120),
      new ScheduledFrequencyClaimBatchSizeRangeRule(64, 120),
      new ScheduledFrequencyClaimCeilingRangeRule(1.5, 315.7),
      new ScheduledFrequencyClaimCodeLengthRule(16),
    ],
  );
}
