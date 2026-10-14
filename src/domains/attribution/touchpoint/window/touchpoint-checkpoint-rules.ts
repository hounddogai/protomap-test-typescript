import { TouchpointCheckpoint } from "./touchpoint-checkpoint.js";

/** A rule a touchpoint checkpoint must pass. Check returns its problems, or none. */
export interface TouchpointCheckpointRule {
  check(item: TouchpointCheckpoint): string[];
}

export class TouchpointCheckpointRequiredDescriptionRule implements TouchpointCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointCheckpoint): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointCheckpointCodeLengthRule implements TouchpointCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointCheckpointAttemptsRangeRule implements TouchpointCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointCheckpoint): string[] {
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

export class TouchpointCheckpointRequiredCodeRule implements TouchpointCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint checkpoint. */
export class TouchpointCheckpointValidator {
  rules: TouchpointCheckpointRule[];

  constructor(rules: TouchpointCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointCheckpoint): string[] {
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

  requireValid(item: TouchpointCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointCheckpoint[]): Map<string, string[]> {
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

export function defaultTouchpointCheckpointValidator(): TouchpointCheckpointValidator {
  return new TouchpointCheckpointValidator(
    [
      new TouchpointCheckpointRequiredDescriptionRule("touchpoint checkpoint needs a value"),
      new TouchpointCheckpointCodeLengthRule(1000),
      new TouchpointCheckpointAttemptsRangeRule(64, 86400),
      new TouchpointCheckpointRequiredCodeRule("touchpoint checkpoint needs an entry"),
    ],
  );
}
