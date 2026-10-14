import * as text from "../../../../kit/text.js";
import { AdaptiveBranchTarget } from "./adaptive-branch-target.js";

/** A rule a adaptive branch target must pass. Check returns its problems, or none. */
export interface AdaptiveBranchTargetRule {
  check(item: AdaptiveBranchTarget): string[];
}

export class AdaptiveBranchTargetCostRangeRule implements AdaptiveBranchTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBranchTarget): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveBranchTargetCodePrefixRule implements AdaptiveBranchTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveBranchTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveBranchTargetUnitLengthRule implements AdaptiveBranchTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBranchTarget): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBranchTargetAllowedCodeRule implements AdaptiveBranchTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveBranchTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class AdaptiveBranchTargetMarginRangeRule implements AdaptiveBranchTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBranchTarget): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveBranchTargetActiveGuardRule implements AdaptiveBranchTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveBranchTarget): string[] {
    if (item.active && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a adaptive branch target. */
export class AdaptiveBranchTargetValidator {
  rules: AdaptiveBranchTargetRule[];

  constructor(rules: AdaptiveBranchTargetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBranchTarget): string[] {
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

  requireValid(item: AdaptiveBranchTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBranchTarget[]): Map<string, string[]> {
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

export function defaultAdaptiveBranchTargetValidator(): AdaptiveBranchTargetValidator {
  return new AdaptiveBranchTargetValidator(
    [
      new AdaptiveBranchTargetCostRangeRule(8.6, 4668.2),
      new AdaptiveBranchTargetCodePrefixRule("Q"),
      new AdaptiveBranchTargetUnitLengthRule(120),
      new AdaptiveBranchTargetAllowedCodeRule(["global", "seasonal"]),
      new AdaptiveBranchTargetMarginRangeRule(7.3, 2479.8),
      new AdaptiveBranchTargetActiveGuardRule(8.5),
    ],
  );
}
