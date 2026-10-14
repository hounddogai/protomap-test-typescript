import { PendingConversionCheckpoint } from "./pending-conversion-checkpoint.js";

/** A rule a pending conversion checkpoint must pass. Check returns its problems, or none. */
export interface PendingConversionCheckpointRule {
  check(item: PendingConversionCheckpoint): string[];
}

export class PendingConversionCheckpointRequiredLabelRule implements PendingConversionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingConversionCheckpointRequiredNameRule implements PendingConversionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingConversionCheckpointAttemptsRangeRule implements PendingConversionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingConversionCheckpoint): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a pending conversion checkpoint. */
export class PendingConversionCheckpointValidator {
  rules: PendingConversionCheckpointRule[];

  constructor(rules: PendingConversionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingConversionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingConversionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingConversionCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingConversionCheckpointValidator(): PendingConversionCheckpointValidator {
  return new PendingConversionCheckpointValidator(
    [
      new PendingConversionCheckpointRequiredLabelRule("pending conversion checkpoint needs this field"),
      new PendingConversionCheckpointRequiredNameRule("pending conversion checkpoint needs an entry"),
      new PendingConversionCheckpointAttemptsRangeRule(3600, 3600),
    ],
  );
}
