import * as text from "../../../../kit/text.js";
import { AdaptiveBranchCycle } from "./adaptive-branch-cycle.js";

/** A rule a adaptive branch cycle must pass. Check returns its problems, or none. */
export interface AdaptiveBranchCycleRule {
  check(item: AdaptiveBranchCycle): string[];
}

export class AdaptiveBranchCycleRequiredLabelRule implements AdaptiveBranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBranchCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBranchCycleCreatedAtRangeRule implements AdaptiveBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBranchCycle): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveBranchCycleAllowedChannelRule implements AdaptiveBranchCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveBranchCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is out of range`];
    return [];
  }
}

export class AdaptiveBranchCycleRequiredChannelRule implements AdaptiveBranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBranchCycle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBranchCycleActiveGuardRule implements AdaptiveBranchCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveBranchCycle): string[] {
    if (item.active && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a adaptive branch cycle. */
export class AdaptiveBranchCycleValidator {
  rules: AdaptiveBranchCycleRule[];

  constructor(rules: AdaptiveBranchCycleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBranchCycle): string[] {
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

  requireValid(item: AdaptiveBranchCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBranchCycle[]): Map<string, string[]> {
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

export function defaultAdaptiveBranchCycleValidator(): AdaptiveBranchCycleValidator {
  return new AdaptiveBranchCycleValidator(
    [
      new AdaptiveBranchCycleRequiredLabelRule("adaptive branch cycle needs an entry"),
      new AdaptiveBranchCycleCreatedAtRangeRule(32, 120),
      new AdaptiveBranchCycleAllowedChannelRule([]),
      new AdaptiveBranchCycleRequiredChannelRule("adaptive branch cycle needs a value"),
      new AdaptiveBranchCycleActiveGuardRule(120),
    ],
  );
}
