import * as text from "../../../../kit/text.js";
import { LevelAllocation } from "./level-allocation.js";

/** A rule a level allocation must pass. Check returns its problems, or none. */
export interface LevelAllocationRule {
  check(item: LevelAllocation): string[];
}

export class LevelAllocationRequiredCodeRule implements LevelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LevelAllocationAllowedCodeRule implements LevelAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class LevelAllocationRequiredRegionRule implements LevelAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelAllocation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class LevelAllocationRegionLengthRule implements LevelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelAllocation): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelAllocationCreatedAtRangeRule implements LevelAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelAllocation): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelAllocationExternalRefLengthRule implements LevelAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelAllocation): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level allocation. */
export class LevelAllocationValidator {
  rules: LevelAllocationRule[];

  constructor(rules: LevelAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: LevelAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelAllocation[]): Map<string, string[]> {
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

export function defaultLevelAllocationValidator(): LevelAllocationValidator {
  return new LevelAllocationValidator(
    [
      new LevelAllocationRequiredCodeRule("level allocation needs this field"),
      new LevelAllocationAllowedCodeRule([]),
      new LevelAllocationRequiredRegionRule("level allocation needs this field"),
      new LevelAllocationRegionLengthRule(64),
      new LevelAllocationCreatedAtRangeRule(255, 3600),
      new LevelAllocationExternalRefLengthRule(255),
    ],
  );
}
