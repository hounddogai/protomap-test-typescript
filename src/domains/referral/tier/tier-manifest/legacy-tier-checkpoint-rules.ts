import { LegacyTierCheckpoint } from "./legacy-tier-checkpoint.js";

/** A rule a legacy tier checkpoint must pass. Check returns its problems, or none. */
export interface LegacyTierCheckpointRule {
  check(item: LegacyTierCheckpoint): string[];
}

export class LegacyTierCheckpointCodeLengthRule implements LegacyTierCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTierCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyTierCheckpointPriorityRangeRule implements LegacyTierCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTierCheckpoint): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyTierCheckpointThresholdRangeRule implements LegacyTierCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTierCheckpoint): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyTierCheckpointLabelLengthRule implements LegacyTierCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTierCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy tier checkpoint. */
export class LegacyTierCheckpointValidator {
  rules: LegacyTierCheckpointRule[];

  constructor(rules: LegacyTierCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTierCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyTierCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTierCheckpoint[]): Map<string, string[]> {
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

export function defaultLegacyTierCheckpointValidator(): LegacyTierCheckpointValidator {
  return new LegacyTierCheckpointValidator(
    [
      new LegacyTierCheckpointCodeLengthRule(80),
      new LegacyTierCheckpointPriorityRangeRule(1000, 86400),
      new LegacyTierCheckpointThresholdRangeRule(9.3, 198),
      new LegacyTierCheckpointLabelLengthRule(120),
    ],
  );
}
