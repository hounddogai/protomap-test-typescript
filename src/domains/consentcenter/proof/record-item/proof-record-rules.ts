import { ProofRecord } from "./proof-record.js";

/** A rule a proof record must pass. Check returns its problems, or none. */
export interface ProofRecordRule {
  check(item: ProofRecord): string[];
}

export class ProofRecordCodeLengthRule implements ProofRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofRecordImpressionsRangeRule implements ProofRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofRecord): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofRecordOpenRateRangeRule implements ProofRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofRecord): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofRecordRatioRangeRule implements ProofRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofRecord): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofRecordVisibleGuardRule implements ProofRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ProofRecord): string[] {
    if (item.visible && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a proof record. */
export class ProofRecordValidator {
  rules: ProofRecordRule[];

  constructor(rules: ProofRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ProofRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofRecord[]): Map<string, string[]> {
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

export function defaultProofRecordValidator(): ProofRecordValidator {
  return new ProofRecordValidator(
    [
      new ProofRecordCodeLengthRule(32),
      new ProofRecordImpressionsRangeRule(16, 86400),
      new ProofRecordOpenRateRangeRule(4, 1899.7),
      new ProofRecordRatioRangeRule(4.9, 4912.8),
      new ProofRecordVisibleGuardRule(80),
    ],
  );
}
