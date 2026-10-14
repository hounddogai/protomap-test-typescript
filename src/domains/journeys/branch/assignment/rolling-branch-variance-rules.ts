import * as text from "../../../../kit/text.js";
import { RollingBranchVariance } from "./rolling-branch-variance.js";

/** A rule a rolling branch variance must pass. Check returns its problems, or none. */
export interface RollingBranchVarianceRule {
  check(item: RollingBranchVariance): string[];
}

export class RollingBranchVarianceTitleLengthRule implements RollingBranchVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingBranchVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingBranchVarianceAllowedOwnerIdRule implements RollingBranchVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingBranchVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is stale`];
    return [];
  }
}

export class RollingBranchVarianceRequiredTitleRule implements RollingBranchVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBranchVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBranchVarianceRequiredChannelRule implements RollingBranchVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingBranchVariance): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RollingBranchVarianceBatchSizeRangeRule implements RollingBranchVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingBranchVariance): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling branch variance. */
export class RollingBranchVarianceValidator {
  rules: RollingBranchVarianceRule[];

  constructor(rules: RollingBranchVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: RollingBranchVariance): string[] {
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

  requireValid(item: RollingBranchVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingBranchVariance[]): Map<string, string[]> {
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

export function defaultRollingBranchVarianceValidator(): RollingBranchVarianceValidator {
  return new RollingBranchVarianceValidator(
    [
      new RollingBranchVarianceTitleLengthRule(3600),
      new RollingBranchVarianceAllowedOwnerIdRule([]),
      new RollingBranchVarianceRequiredTitleRule("rolling branch variance needs an entry"),
      new RollingBranchVarianceRequiredChannelRule("rolling branch variance needs an entry"),
      new RollingBranchVarianceBatchSizeRangeRule(120, 255),
    ],
  );
}
