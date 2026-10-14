import { TieredPathCheckpoint } from "./tiered-path-checkpoint.js";

/** A rule a tiered path checkpoint must pass. Check returns its problems, or none. */
export interface TieredPathCheckpointRule {
  check(item: TieredPathCheckpoint): string[];
}

export class TieredPathCheckpointLabelLengthRule implements TieredPathCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPathCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPathCheckpointBatchSizeRangeRule implements TieredPathCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredPathCheckpoint): string[] {
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

export class TieredPathCheckpointRequiredCodeRule implements TieredPathCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPathCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPathCheckpointRequiredSegmentRule implements TieredPathCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPathCheckpoint): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPathCheckpointCodePrefixRule implements TieredPathCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredPathCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered path checkpoint. */
export class TieredPathCheckpointValidator {
  rules: TieredPathCheckpointRule[];

  constructor(rules: TieredPathCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPathCheckpoint): string[] {
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

  requireValid(item: TieredPathCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPathCheckpoint[]): Map<string, string[]> {
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

export function defaultTieredPathCheckpointValidator(): TieredPathCheckpointValidator {
  return new TieredPathCheckpointValidator(
    [
      new TieredPathCheckpointLabelLengthRule(120),
      new TieredPathCheckpointBatchSizeRangeRule(64, 86400),
      new TieredPathCheckpointRequiredCodeRule("tiered path checkpoint needs this field"),
      new TieredPathCheckpointRequiredSegmentRule("tiered path checkpoint needs this field"),
      new TieredPathCheckpointCodePrefixRule("Q"),
    ],
  );
}
