import * as text from "../../../../kit/text.js";
import { RollingWarmupMapping } from "./rolling-warmup-mapping.js";

/** A rule a rolling warmup mapping must pass. Check returns its problems, or none. */
export interface RollingWarmupMappingRule {
  check(item: RollingWarmupMapping): string[];
}

export class RollingWarmupMappingAllowedLabelRule implements RollingWarmupMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingWarmupMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class RollingWarmupMappingRequiredCodeRule implements RollingWarmupMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWarmupMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWarmupMappingBudgetRangeRule implements RollingWarmupMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWarmupMapping): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling warmup mapping. */
export class RollingWarmupMappingValidator {
  rules: RollingWarmupMappingRule[];

  constructor(rules: RollingWarmupMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWarmupMapping): string[] {
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

  requireValid(item: RollingWarmupMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWarmupMapping[]): Map<string, string[]> {
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

export function defaultRollingWarmupMappingValidator(): RollingWarmupMappingValidator {
  return new RollingWarmupMappingValidator(
    [
      new RollingWarmupMappingAllowedLabelRule(["batched", "rolling"]),
      new RollingWarmupMappingRequiredCodeRule("rolling warmup mapping needs this field"),
      new RollingWarmupMappingBudgetRangeRule(5.9, 2708.3),
    ],
  );
}
