import { BatchedFlightSnapshot } from "./batched-flight-snapshot.js";

/** A rule a batched flight snapshot must pass. Check returns its problems, or none. */
export interface BatchedFlightSnapshotRule {
  check(item: BatchedFlightSnapshot): string[];
}

export class BatchedFlightSnapshotRequiredChecksumRule implements BatchedFlightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightSnapshot): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightSnapshotCodePrefixRule implements BatchedFlightSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFlightSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFlightSnapshotChecksumLengthRule implements BatchedFlightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFlightSnapshot): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFlightSnapshotRequiredCodeRule implements BatchedFlightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFlightSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedFlightSnapshotTitleLengthRule implements BatchedFlightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedFlightSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedFlightSnapshotImpressionsRangeRule implements BatchedFlightSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFlightSnapshot): string[] {
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

/** Runs every rule of a batched flight snapshot. */
export class BatchedFlightSnapshotValidator {
  rules: BatchedFlightSnapshotRule[];

  constructor(rules: BatchedFlightSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFlightSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedFlightSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFlightSnapshot[]): Map<string, string[]> {
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

export function defaultBatchedFlightSnapshotValidator(): BatchedFlightSnapshotValidator {
  return new BatchedFlightSnapshotValidator(
    [
      new BatchedFlightSnapshotRequiredChecksumRule("batched flight snapshot needs a value"),
      new BatchedFlightSnapshotCodePrefixRule("X"),
      new BatchedFlightSnapshotChecksumLengthRule(16),
      new BatchedFlightSnapshotRequiredCodeRule("batched flight snapshot needs a value"),
      new BatchedFlightSnapshotTitleLengthRule(86400),
      new BatchedFlightSnapshotImpressionsRangeRule(255, 86400),
    ],
  );
}
