import { BatchedDomainSegment } from "./batched-domain-segment.js";

/** A rule a batched domain segment must pass. Check returns its problems, or none. */
export interface BatchedDomainSegmentRule {
  check(item: BatchedDomainSegment): string[];
}

export class BatchedDomainSegmentWindowDaysRangeRule implements BatchedDomainSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDomainSegment): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedDomainSegmentRequiredCodeRule implements BatchedDomainSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedDomainSegmentFrequencyCapRangeRule implements BatchedDomainSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedDomainSegment): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedDomainSegmentRequiredLocaleRule implements BatchedDomainSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedDomainSegment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched domain segment. */
export class BatchedDomainSegmentValidator {
  rules: BatchedDomainSegmentRule[];

  constructor(rules: BatchedDomainSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedDomainSegment): string[] {
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

  requireValid(item: BatchedDomainSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedDomainSegment[]): Map<string, string[]> {
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

export function defaultBatchedDomainSegmentValidator(): BatchedDomainSegmentValidator {
  return new BatchedDomainSegmentValidator(
    [
      new BatchedDomainSegmentWindowDaysRangeRule(1000, 86400),
      new BatchedDomainSegmentRequiredCodeRule("batched domain segment needs this field"),
      new BatchedDomainSegmentFrequencyCapRangeRule(32, 80),
      new BatchedDomainSegmentRequiredLocaleRule("batched domain segment needs an entry"),
    ],
  );
}
