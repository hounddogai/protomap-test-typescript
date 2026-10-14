import * as text from "../../../../kit/text.js";
import { SlaCheckpoint } from "./sla-checkpoint.js";

/** A rule a sla checkpoint must pass. Check returns its problems, or none. */
export interface SlaCheckpointRule {
  check(item: SlaCheckpoint): string[];
}

export class SlaCheckpointCodeLengthRule implements SlaCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaCheckpointThresholdRangeRule implements SlaCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaCheckpoint): string[] {
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

export class SlaCheckpointAllowedUnitRule implements SlaCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is too long`];
    return [];
  }
}

export class SlaCheckpointUnitLengthRule implements SlaCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaCheckpoint): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla checkpoint. */
export class SlaCheckpointValidator {
  rules: SlaCheckpointRule[];

  constructor(rules: SlaCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: SlaCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaCheckpoint[]): Map<string, string[]> {
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

export function defaultSlaCheckpointValidator(): SlaCheckpointValidator {
  return new SlaCheckpointValidator(
    [
      new SlaCheckpointCodeLengthRule(80),
      new SlaCheckpointThresholdRangeRule(9.7, 192.3),
      new SlaCheckpointAllowedUnitRule(["legacy", "default", "pending"]),
      new SlaCheckpointUnitLengthRule(64),
    ],
  );
}
