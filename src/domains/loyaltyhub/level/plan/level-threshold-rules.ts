import { LevelThreshold } from "./level-threshold.js";

/** A rule a level threshold must pass. Check returns its problems, or none. */
export interface LevelThresholdRule {
  check(item: LevelThreshold): string[];
}

export class LevelThresholdCodeLengthRule implements LevelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelThresholdQuantityRangeRule implements LevelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelThreshold): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelThresholdRequiredRegionRule implements LevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelThreshold): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class LevelThresholdRequiredCodeRule implements LevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelThresholdRequiredLabelRule implements LevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LevelThresholdSequenceRangeRule implements LevelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelThreshold): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a level threshold. */
export class LevelThresholdValidator {
  rules: LevelThresholdRule[];

  constructor(rules: LevelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LevelThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelThreshold[]): Map<string, string[]> {
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

export function defaultLevelThresholdValidator(): LevelThresholdValidator {
  return new LevelThresholdValidator(
    [
      new LevelThresholdCodeLengthRule(3600),
      new LevelThresholdQuantityRangeRule(32, 120),
      new LevelThresholdRequiredRegionRule("level threshold needs a value"),
      new LevelThresholdRequiredCodeRule("level threshold needs a value"),
      new LevelThresholdRequiredLabelRule("level threshold needs a value"),
      new LevelThresholdSequenceRangeRule(80, 120),
    ],
  );
}
