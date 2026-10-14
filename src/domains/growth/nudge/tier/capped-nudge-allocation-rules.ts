import * as text from "../../../../kit/text.js";
import { CappedNudgeAllocation } from "./capped-nudge-allocation.js";

/** A rule a capped nudge allocation must pass. Check returns its problems, or none. */
export interface CappedNudgeAllocationRule {
  check(item: CappedNudgeAllocation): string[];
}

export class CappedNudgeAllocationVersionRangeRule implements CappedNudgeAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeAllocation): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedNudgeAllocationRequiredCodeRule implements CappedNudgeAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedNudgeAllocationAllowedChannelRule implements CappedNudgeAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedNudgeAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

/** Runs every rule of a capped nudge allocation. */
export class CappedNudgeAllocationValidator {
  rules: CappedNudgeAllocationRule[];

  constructor(rules: CappedNudgeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: CappedNudgeAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedNudgeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedNudgeAllocation[]): Map<string, string[]> {
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

export function defaultCappedNudgeAllocationValidator(): CappedNudgeAllocationValidator {
  return new CappedNudgeAllocationValidator(
    [
      new CappedNudgeAllocationVersionRangeRule(64, 80),
      new CappedNudgeAllocationRequiredCodeRule("capped nudge allocation needs a value"),
      new CappedNudgeAllocationAllowedChannelRule(["primary"]),
    ],
  );
}
