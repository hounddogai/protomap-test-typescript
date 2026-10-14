import * as text from "../../../../kit/text.js";
import { SeasonalWarmupAllocation } from "./seasonal-warmup-allocation.js";

/** A rule a seasonal warmup allocation must pass. Check returns its problems, or none. */
export interface SeasonalWarmupAllocationRule {
  check(item: SeasonalWarmupAllocation): string[];
}

export class SeasonalWarmupAllocationCodePrefixRule implements SeasonalWarmupAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalWarmupAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalWarmupAllocationAllowedCohortRule implements SeasonalWarmupAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalWarmupAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is duplicated`];
    return [];
  }
}

export class SeasonalWarmupAllocationCodeLengthRule implements SeasonalWarmupAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWarmupAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal warmup allocation. */
export class SeasonalWarmupAllocationValidator {
  rules: SeasonalWarmupAllocationRule[];

  constructor(rules: SeasonalWarmupAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWarmupAllocation): string[] {
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

  requireValid(item: SeasonalWarmupAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWarmupAllocation[]): Map<string, string[]> {
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

export function defaultSeasonalWarmupAllocationValidator(): SeasonalWarmupAllocationValidator {
  return new SeasonalWarmupAllocationValidator(
    [
      new SeasonalWarmupAllocationCodePrefixRule("ACM"),
      new SeasonalWarmupAllocationAllowedCohortRule(["strict"]),
      new SeasonalWarmupAllocationCodeLengthRule(86400),
    ],
  );
}
