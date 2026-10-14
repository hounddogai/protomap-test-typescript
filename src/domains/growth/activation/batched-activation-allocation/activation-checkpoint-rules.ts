import { ActivationCheckpoint } from "./activation-checkpoint.js";

/** A rule a activation checkpoint must pass. Check returns its problems, or none. */
export interface ActivationCheckpointRule {
  check(item: ActivationCheckpoint): string[];
}

export class ActivationCheckpointCostRangeRule implements ActivationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationCheckpoint): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationCheckpointRequiredCodeRule implements ActivationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationCheckpointLabelLengthRule implements ActivationCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationCheckpointRequiredVariantRule implements ActivationCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationCheckpoint): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationCheckpointWeightRangeRule implements ActivationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationCheckpoint): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a activation checkpoint. */
export class ActivationCheckpointValidator {
  rules: ActivationCheckpointRule[];

  constructor(rules: ActivationCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationCheckpoint): string[] {
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

  requireValid(item: ActivationCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationCheckpoint[]): Map<string, string[]> {
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

export function defaultActivationCheckpointValidator(): ActivationCheckpointValidator {
  return new ActivationCheckpointValidator(
    [
      new ActivationCheckpointCostRangeRule(3.9, 3717.8),
      new ActivationCheckpointRequiredCodeRule("activation checkpoint needs this field"),
      new ActivationCheckpointLabelLengthRule(3600),
      new ActivationCheckpointRequiredVariantRule("activation checkpoint needs an entry"),
      new ActivationCheckpointWeightRangeRule(4.7, 3361.1),
    ],
  );
}
