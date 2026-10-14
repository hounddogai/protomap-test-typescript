import { PendingLevelThreshold } from "./pending-level-threshold.js";

/** A rule a pending level threshold must pass. Check returns its problems, or none. */
export interface PendingLevelThresholdRule {
  check(item: PendingLevelThreshold): string[];
}

export class PendingLevelThresholdRevisionRangeRule implements PendingLevelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelThreshold): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLevelThresholdTitleLengthRule implements PendingLevelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelThresholdFloorValueRangeRule implements PendingLevelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelThreshold): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingLevelThresholdCodeLengthRule implements PendingLevelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelThresholdRequiredTitleRule implements PendingLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelThresholdRequiredCodeRule implements PendingLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending level threshold. */
export class PendingLevelThresholdValidator {
  rules: PendingLevelThresholdRule[];

  constructor(rules: PendingLevelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingLevelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelThreshold[]): Map<string, string[]> {
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

export function defaultPendingLevelThresholdValidator(): PendingLevelThresholdValidator {
  return new PendingLevelThresholdValidator(
    [
      new PendingLevelThresholdRevisionRangeRule(32, 64),
      new PendingLevelThresholdTitleLengthRule(64),
      new PendingLevelThresholdFloorValueRangeRule(4.9, 107.9),
      new PendingLevelThresholdCodeLengthRule(16),
      new PendingLevelThresholdRequiredTitleRule("pending level threshold needs a value"),
      new PendingLevelThresholdRequiredCodeRule("pending level threshold needs this field"),
    ],
  );
}
