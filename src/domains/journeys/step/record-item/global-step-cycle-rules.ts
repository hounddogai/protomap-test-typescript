import * as text from "../../../../kit/text.js";
import { GlobalStepCycle } from "./global-step-cycle.js";

/** A rule a global step cycle must pass. Check returns its problems, or none. */
export interface GlobalStepCycleRule {
  check(item: GlobalStepCycle): string[];
}

export class GlobalStepCycleCodePrefixRule implements GlobalStepCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalStepCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalStepCycleCodeLengthRule implements GlobalStepCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalStepCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalStepCycleAllowedLabelRule implements GlobalStepCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalStepCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class GlobalStepCycleActiveGuardRule implements GlobalStepCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalStepCycle): string[] {
    if (item.active && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while active`];
    return [];
  }
}

export class GlobalStepCycleScoreRangeRule implements GlobalStepCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalStepCycle): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalStepCycleRequiredLabelRule implements GlobalStepCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalStepCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global step cycle. */
export class GlobalStepCycleValidator {
  rules: GlobalStepCycleRule[];

  constructor(rules: GlobalStepCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalStepCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalStepCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalStepCycle[]): Map<string, string[]> {
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

export function defaultGlobalStepCycleValidator(): GlobalStepCycleValidator {
  return new GlobalStepCycleValidator(
    [
      new GlobalStepCycleCodePrefixRule("ACM"),
      new GlobalStepCycleCodeLengthRule(16),
      new GlobalStepCycleAllowedLabelRule([]),
      new GlobalStepCycleActiveGuardRule(6.7),
      new GlobalStepCycleScoreRangeRule(2.4, 641.6),
      new GlobalStepCycleRequiredLabelRule("global step cycle needs this field"),
    ],
  );
}
