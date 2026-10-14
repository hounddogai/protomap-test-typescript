import { ManualPathAdjustment } from "./manual-path-adjustment.js";

/** A rule a manual path adjustment must pass. Check returns its problems, or none. */
export interface ManualPathAdjustmentRule {
  check(item: ManualPathAdjustment): string[];
}

export class ManualPathAdjustmentRequiredChecksumRule implements ManualPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPathAdjustment): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPathAdjustmentTitleLengthRule implements ManualPathAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPathAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPathAdjustmentRequiredNameRule implements ManualPathAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPathAdjustment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPathAdjustmentBatchSizeRangeRule implements ManualPathAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPathAdjustment): string[] {
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

/** Runs every rule of a manual path adjustment. */
export class ManualPathAdjustmentValidator {
  rules: ManualPathAdjustmentRule[];

  constructor(rules: ManualPathAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPathAdjustment): string[] {
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

  requireValid(item: ManualPathAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPathAdjustment[]): Map<string, string[]> {
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

export function defaultManualPathAdjustmentValidator(): ManualPathAdjustmentValidator {
  return new ManualPathAdjustmentValidator(
    [
      new ManualPathAdjustmentRequiredChecksumRule("manual path adjustment needs this field"),
      new ManualPathAdjustmentTitleLengthRule(64),
      new ManualPathAdjustmentRequiredNameRule("manual path adjustment needs a value"),
      new ManualPathAdjustmentBatchSizeRangeRule(255, 3600),
    ],
  );
}
