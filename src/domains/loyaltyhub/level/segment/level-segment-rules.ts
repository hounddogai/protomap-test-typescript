import * as text from "../../../../kit/text.js";
import { LevelSegment } from "./level-segment.js";

/** A rule a level segment must pass. Check returns its problems, or none. */
export interface LevelSegmentRule {
  check(item: LevelSegment): string[];
}

export class LevelSegmentLabelLengthRule implements LevelSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelSegmentRequiredCodeRule implements LevelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelSegmentCeilingRangeRule implements LevelSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelSegment): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelSegmentAllowedCodeRule implements LevelSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class LevelSegmentSequenceRangeRule implements LevelSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelSegment): string[] {
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

export class LevelSegmentCodeLengthRule implements LevelSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level segment. */
export class LevelSegmentValidator {
  rules: LevelSegmentRule[];

  constructor(rules: LevelSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: LevelSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelSegment[]): Map<string, string[]> {
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

export function defaultLevelSegmentValidator(): LevelSegmentValidator {
  return new LevelSegmentValidator(
    [
      new LevelSegmentLabelLengthRule(86400),
      new LevelSegmentRequiredCodeRule("level segment needs this field"),
      new LevelSegmentCeilingRangeRule(3, 3272.7),
      new LevelSegmentAllowedCodeRule(["global", "primary", "manual"]),
      new LevelSegmentSequenceRangeRule(16, 64),
      new LevelSegmentCodeLengthRule(1000),
    ],
  );
}
