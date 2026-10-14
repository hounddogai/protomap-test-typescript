import { PacingCheckpoint } from "./pacing-checkpoint.js";

/** A rule a pacing checkpoint must pass. Check returns its problems, or none. */
export interface PacingCheckpointRule {
  check(item: PacingCheckpoint): string[];
}

export class PacingCheckpointCodeLengthRule implements PacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingCheckpointConversionRateRangeRule implements PacingCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingCheckpoint): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingCheckpointLabelLengthRule implements PacingCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingCheckpointBatchSizeRangeRule implements PacingCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingCheckpoint): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingCheckpointRequiredNameRule implements PacingCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing checkpoint. */
export class PacingCheckpointValidator {
  rules: PacingCheckpointRule[];

  constructor(rules: PacingCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PacingCheckpoint): string[] {
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

  requireValid(item: PacingCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingCheckpoint[]): Map<string, string[]> {
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

export function defaultPacingCheckpointValidator(): PacingCheckpointValidator {
  return new PacingCheckpointValidator(
    [
      new PacingCheckpointCodeLengthRule(32),
      new PacingCheckpointConversionRateRangeRule(3.6, 2860.1),
      new PacingCheckpointLabelLengthRule(255),
      new PacingCheckpointBatchSizeRangeRule(80, 1000),
      new PacingCheckpointRequiredNameRule("pacing checkpoint needs this field"),
    ],
  );
}
